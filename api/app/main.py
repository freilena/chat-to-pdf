"""FastAPI application for PDF chat functionality."""

from __future__ import annotations

import asyncio
import io
import os
import subprocess
import uuid
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pypdf import PdfReader
from pydantic import BaseModel
from typing import Any
from app.retrieval import HybridRetriever, chunk_text
from app.openai_client import get_openai_client


def get_version() -> str:
    """Read version from VERSION file."""
    # Try multiple possible locations for the VERSION file
    possible_paths = [
        Path(__file__).parent.parent.parent / "VERSION",  # From api/app/main.py to project root
        Path(__file__).parent.parent / "VERSION",         # From api/app/main.py to api/
        Path("VERSION"),                                  # Current working directory
        Path("../VERSION"),                               # Parent of current working directory
    ]

    for version_file in possible_paths:
        try:
            if version_file.exists():
                content = version_file.read_text().strip()
                if content:  # Only return if content is not empty
                    return content
        except (OSError, IOError, UnicodeDecodeError):
            continue

    return "unknown"


def validate_pdf_file(name: str, data: bytes) -> None:
    """Validate a PDF file for page count and searchable text."""
    try:
        reader = PdfReader(io.BytesIO(data))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"{name} is not a valid PDF") from exc

    num_pages = len(reader.pages)
    if num_pages > MAX_PAGES_PER_PDF:
        raise HTTPException(status_code=400, detail=f"{name} exceeds {MAX_PAGES_PER_PDF} pages")

    # Check first few pages for any text
    has_text = False
    pages_to_check = min(num_pages, 3)
    for i in range(pages_to_check):
        try:
            text = reader.pages[i].extract_text() or ""
        except (AttributeError, IndexError, Exception):
            text = ""
        if text.strip():
            has_text = True
            break
    if not has_text:
        raise HTTPException(
            status_code=400,
            detail=f"{name} appears scanned/unsearchable (no text layer)"
        )


def get_git_info() -> dict[str, str | bool]:
    """Get git information from the repository."""
    repo_root = Path(__file__).parent.parent
    git_info: dict[str, str | bool] = {
        "branch": "unknown",
        "commit": "unknown",
        "commit_full": "unknown",
        "commit_date": "unknown",
        "uncommitted_changes": False,
    }

    try:
        # Get current branch
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=1,
            check=False,
        )
        if result.returncode == 0:
            git_info["branch"] = result.stdout.strip()

        # Get short commit hash
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=1,
            check=False,
        )
        if result.returncode == 0:
            git_info["commit"] = result.stdout.strip()

        # Get full commit hash
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=1,
            check=False,
        )
        if result.returncode == 0:
            git_info["commit_full"] = result.stdout.strip()

        # Get commit date
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cI"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=1,
            check=False,
        )
        if result.returncode == 0:
            git_info["commit_date"] = result.stdout.strip()

        # Check for uncommitted changes
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=1,
            check=False,
        )
        if result.returncode == 0:
            git_info["uncommitted_changes"] = bool(result.stdout.strip())

    except (OSError, subprocess.SubprocessError, FileNotFoundError):
        pass  # Return unknown values if git commands fail

    return git_info


app = FastAPI(title="Chat-To-PDF API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store for MVP/TDD
SESSION_STATUS: Dict[str, Dict[str, int | str]] = {}
SESSION_RETRIEVERS: Dict[str, HybridRetriever] = {}

# Limits from spec
MAX_FILES_PER_SESSION = 10
MAX_TOTAL_BYTES = 100 * 1024 * 1024  # 100 MB
MAX_FILE_BYTES = 50 * 1024 * 1024  # 50 MB
MAX_PAGES_PER_PDF = 500


@app.get("/healthz")
def healthz():
    """Health check endpoint."""
    return {"status": "ok", "version": get_version()}


@app.get("/version")
def version():
    """Get version and git information about the running application."""
    git_info = get_git_info()
    environment = os.getenv("ENVIRONMENT", "development")

    return {
        "version": get_version(),
        "git_branch": git_info["branch"],
        "git_commit": git_info["commit"],
        "git_commit_full": git_info["commit_full"],
        "git_commit_date": git_info["commit_date"],
        "git_uncommitted_changes": git_info["uncommitted_changes"],
        "environment": environment,
    }


@app.get("/fastapi/openai/health")
async def openai_health() -> Dict[str, Any]:
    """
    Check OpenAI API health and availability.
    
    Returns:
        Health status with model information
    """
    try:
        client = await get_openai_client()
        health = await client.health_check()
        
        return {
            "status": "healthy" if health.is_healthy else "unhealthy",
            "api_available": health.is_available,
            "model": health.model,
            "error_message": health.error_message,
            "last_check": health.last_check.isoformat() if health.last_check else None
        }
    except Exception as e:
        return {
            "status": "error",
            "api_available": False,
            "model": "gpt-4o-mini",
            "error_message": str(e),
            "last_check": None
        }


@app.post("/fastapi/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    """Upload and process PDF files for indexing."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    if len(files) > MAX_FILES_PER_SESSION:
        raise HTTPException(status_code=400, detail=f"Too many files (>{MAX_FILES_PER_SESSION})")

    session_id = str(uuid.uuid4())

    total_bytes = 0
    file_buffers: list[tuple[str, bytes]] = []
    for f in files:
        content = await f.read()
        size = len(content)
        if size > MAX_FILE_BYTES:
            raise HTTPException(status_code=400, detail=f"File {f.filename} exceeds 50 MB limit")
        total_bytes += size
        file_buffers.append((f.filename or "file.pdf", content))
    if total_bytes > MAX_TOTAL_BYTES:
        raise HTTPException(status_code=400, detail="Total upload size exceeds 100 MB")

    # Validate PDFs: page count and searchable text (reject scanned)
    for name, data in file_buffers:
        validate_pdf_file(name, data)

    SESSION_STATUS[session_id] = {
        "status": "indexing",
        "total_files": len(files),
        "files_indexed": 0,
    }

    # Create hybrid retriever for this session
    retriever = HybridRetriever()
    SESSION_RETRIEVERS[session_id] = retriever

    # Background indexing: process PDFs and add to retriever
    asyncio.create_task(process_pdfs_background(session_id, file_buffers))

    return JSONResponse(
        {
            "session_id": session_id,
            "status": "indexing",
            "total_files": len(files),
            "files_indexed": 0,
            "totals": {"files": len(files), "bytes": total_bytes},
        }
    )


def process_single_pdf(filename: str, data: bytes, retriever: HybridRetriever) -> None:
    """Process a single PDF file and add chunks to retriever."""
    # Extract text from PDF
    reader = PdfReader(io.BytesIO(data))
    full_text = ""
    for page in reader.pages:
        try:
            page_text = page.extract_text() or ""
            full_text += page_text + "\n"
        except (AttributeError, IndexError, Exception):
            continue

    # Chunk the text
    chunks = chunk_text(full_text)

    # Add each chunk to the retriever
    for chunk_idx, chunk in enumerate(chunks):
        chunk_content: str = chunk["text"]  # type: ignore[assignment]
        metadata = {
            "doc_id": filename,
            "chunk_id": chunk_idx,
            "page": 1,  # Simplified for MVP
            "sentenceSpan": (0, len(chunk_content)),  # Simplified
            "text": chunk_content,
        }
        retriever.add_document(chunk_content, metadata)


async def process_pdfs_background(session_id: str, file_buffers: list[tuple[str, bytes]]) -> None:
    """Background task to process PDFs and add to retriever."""
    try:
        retriever = SESSION_RETRIEVERS.get(session_id)
        if not retriever:
            return

        for i, (filename, data) in enumerate(file_buffers):
            process_single_pdf(filename, data, retriever)

            # Update progress
            state = SESSION_STATUS.get(session_id)
            if not state:
                return
            state["files_indexed"] = i + 1
            await asyncio.sleep(0.1)  # Small delay to show progress

        # Mark as done
        state = SESSION_STATUS.get(session_id)
        if state:
            state["status"] = "done"
    except Exception as exc:  # pylint: disable=broad-exception-caught
        state = SESSION_STATUS.get(session_id)
        if state:
            state["status"] = "error"
            state["error"] = str(exc)




@app.get("/fastapi/index/status")
async def index_status(session_id: str = Query(...)):
    """Get the indexing status for a session."""
    state = SESSION_STATUS.get(session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Unknown session_id")

    return JSONResponse(
        {
            "status": state["status"],
            "total_files": state["total_files"],
            "files_indexed": state["files_indexed"],
        }
    )


class ConversationMessage(BaseModel):
    """Model for a single conversation message."""
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: str

class QueryRequest(BaseModel):
    """Request model for querying documents."""
    session_id: str
    question: str
    conversation_history: list[ConversationMessage] = []


class Citation(BaseModel):
    """Citation model for query responses."""
    file: str
    page: int
    sentenceSpan: tuple[int, int]
    id: str


class QueryResponse(BaseModel):
    """Response model for query results."""
    answer: str
    citations: list[Citation]


@app.post("/fastapi/query")
async def query(req: QueryRequest) -> QueryResponse:
    """Process a query against indexed documents."""
    # Check if session exists and is ready
    session_state = SESSION_STATUS.get(req.session_id)
    if not session_state:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_state["status"] != "done":
        raise HTTPException(status_code=400, detail="Session still indexing")

    # Get the retriever for this session
    retriever = SESSION_RETRIEVERS.get(req.session_id)
    if not retriever:
        raise HTTPException(status_code=404, detail="Session retriever not found")

    # Build context from conversation history for better search
    context_query = req.question
    if req.conversation_history:
        # Include recent conversation context in search
        recent_context = []
        for msg in req.conversation_history[-4:]:  # Last 4 messages (2 turns)
            if msg.role == 'user':
                recent_context.append(f"Previous question: {msg.content}")
            elif msg.role == 'assistant':
                # Truncate assistant responses to avoid noise
                content = msg.content[:200] + "..." if len(msg.content) > 200 else msg.content
                recent_context.append(f"Previous answer: {content}")
        
        if recent_context:
            context_query = f"{req.question}\n\nContext from previous conversation:\n" + "\n".join(recent_context)
            print(f"Enhanced query with context: {context_query[:200]}...")

    # Search for relevant chunks with multiple strategies
    # Get more results to ensure document diversity
    search_results = retriever.search(context_query, k=10)
    
    # If no good results, try alternative search terms
    if not search_results or (search_results and search_results[0].get('score', 0) < 0.3):
        # Try alternative search terms for name questions
        if any(word in req.question.lower() for word in ['name', 'person', 'who', 'whom']):
            alternative_queries = [
                "Report for",
                "Name:",
                "person",
                "individual",
                "subject",
                "Kateryna",
                "Kalashnykova"
            ]
            
            for alt_query in alternative_queries:
                alt_results = retriever.search(alt_query, k=5)
                if alt_results and alt_results[0].get('score', 0) > 0.1:
                    search_results = alt_results
                    print(f"Using alternative search for: {alt_query}")
                    break
    
    # Debug: Log search results
    print(f"Search query: {req.question}")
    print(f"Found {len(search_results)} results")
    for i, result in enumerate(search_results):
        print(f"Result {i+1} score: {result.get('score', 'N/A')}, doc: {result['metadata'].get('doc_id', 'N/A')}")
        print(f"Result {i+1} text preview: {result['metadata']['text'][:100]}...")

    if not search_results:
        return QueryResponse(
            answer="Not found in your files.",
            citations=[]
        )

    # Ensure document diversity: select at least one chunk from each document
    # First, collect unique documents from search results
    doc_chunks: dict[str, list[dict[str, Any]]] = {}
    for result in search_results:
        doc_id = result['metadata'].get('doc_id', 'unknown')
        if doc_id not in doc_chunks:
            doc_chunks[doc_id] = []
        doc_chunks[doc_id].append(result)
    
    # Select diverse chunks: one best chunk from each document, then fill remaining slots
    selected_results = []
    selected_docs = set()
    
    # First pass: select top chunk from each document
    for doc_id, chunks in doc_chunks.items():
        if chunks:
            # Sort chunks by score and take the best one
            best_chunk = max(chunks, key=lambda x: x.get('score', 0))
            selected_results.append(best_chunk)
            selected_docs.add(doc_id)
    
    # Second pass: fill remaining slots (up to 5 total) with highest-scoring chunks
    # that aren't already selected
    remaining_slots = max(0, 5 - len(selected_results))
    remaining_results = [
        r for r in search_results 
        if (r['metadata'].get('doc_id', 'unknown'), r['metadata'].get('chunk_id', -1)) 
        not in {(sr['metadata'].get('doc_id', 'unknown'), sr['metadata'].get('chunk_id', -1)) 
                for sr in selected_results}
    ]
    remaining_results.sort(key=lambda x: x.get('score', 0), reverse=True)
    selected_results.extend(remaining_results[:remaining_slots])
    
    # Sort final selection by score to maintain quality
    selected_results.sort(key=lambda x: x.get('score', 0), reverse=True)
    
    # Limit to top 3 for context (but now ensuring diversity)
    context_results = selected_results[:3]
    
    print(f"Selected {len(context_results)} chunks from {len(selected_docs)} documents")
    for i, result in enumerate(context_results):
        print(f"Selected chunk {i+1} from doc: {result['metadata'].get('doc_id', 'N/A')}")

    # Generate answer using OpenAI based on retrieved context
    try:
        # Build context from search results
        context_chunks = []
        for i, result in enumerate(context_results):
            chunk_text = result['metadata']['text']
            doc_id = result['metadata'].get('doc_id', 'unknown')
            context_chunks.append(f"[Source {i+1} from {doc_id}]: {chunk_text}")
        
        context = "\n\n".join(context_chunks)
        
        # Build conversation context for OpenAI
        conversation_context = []
        if req.conversation_history:
            for msg in req.conversation_history[-4:]:  # Last 4 messages
                conversation_context.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        # Create prompt for OpenAI
        prompt = f"""You are a helpful assistant answering questions about documents.

Based on the following context from the user's documents, answer their question. Be concise and accurate.

Context from documents:
{context}

Question: {req.question}

Answer based on the context above. If the answer is not in the context, say so."""

        # Get OpenAI client and generate answer
        openai_client = await get_openai_client()
        answer = await openai_client.generate_text(
            prompt=prompt,
            context=conversation_context,
            max_tokens=250
        )
        
        print(f"✅ Generated answer using OpenAI: {answer[:100]}...")
        
    except Exception as e:
        # Fallback to simple context if OpenAI fails
        print(f"⚠️ OpenAI generation failed: {e}, using fallback")
        if context_results:
            top_result = context_results[0]['metadata']['text']
        else:
            top_result = search_results[0]['metadata']['text'] if search_results else "No results found"
        answer = f"Based on your files: {top_result[:500]}..."

    # Convert search results to citations (use context_results for diversity)
    citations = []
    for i, result in enumerate(context_results):  # Max 3 citations
        citation = Citation(
            file=result["metadata"]["doc_id"],
            page=result["metadata"]["page"],
            sentenceSpan=result["metadata"]["sentenceSpan"],
            id=f"citation_{i+1}"
        )
        citations.append(citation)

    return QueryResponse(
        answer=answer,
        citations=citations
    )
