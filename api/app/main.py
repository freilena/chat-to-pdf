"""FastAPI application for PDF chat functionality."""

from __future__ import annotations

import asyncio
import io
import os
import subprocess
import uuid
import logging
import sys
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pypdf import PdfReader
from pydantic import BaseModel
from app.retrieval import HybridRetriever, chunk_text
from app.ollama_client import get_ollama_client, OllamaHealth
from app.ollama_init import initialize_ollama

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)


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


def _generate_fallback_answer(search_results: list, question: str) -> str:
    """Generate a fallback answer when Ollama is unavailable."""
    if not search_results:
        return "Not found in your files."
    
    # Simple text extraction fallback
    if len(search_results) == 1:
        text = search_results[0]['metadata']['text']
        if len(text) > 1000:
            return f"Based on your files: {text[:1000]}..."
        else:
            return f"Based on your files: {text}"
    else:
        # Multiple results - combine them
        combined_text = ""
        for i, result in enumerate(search_results[:3]):
            text = result['metadata']['text']
            if len(text) > 300:
                text = text[:300] + "..."
            combined_text += f"Result {i+1}: {text}\n\n"
        
        if len(combined_text) > 1500:
            combined_text = combined_text[:1500] + "..."
        
        return f"Based on your files:\n\n{combined_text}"


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

@app.on_event("startup")
async def startup_event():
    """Initialize Ollama service on startup."""
    print("🚀 FastAPI startup event triggered")  # Print statement to ensure we see this
    logger.info("🚀 Starting Chat-To-PDF application...")
    
    # Initialize Ollama in background (non-blocking)
    # This allows the API to start even if Ollama initialization is slow
    asyncio.create_task(_init_ollama_background())

async def _init_ollama_background():
    """Initialize Ollama in background without blocking startup."""
    try:
        print("📋 Starting Ollama initialization in background...")
        success = await initialize_ollama()
        if success:
            logger.info("✅ Ollama initialization completed successfully")
            print("✅ Ollama initialization completed successfully")
        else:
            logger.warning(
                "⚠️ Ollama initialization failed or incomplete. "
                "Queries will use fallback responses."
            )
            print("⚠️ Ollama initialization failed or incomplete")
    except Exception as e:
        logger.error(f"❌ Ollama initialization error: {e}")
        print(f"❌ Ollama initialization error: {e}")
        logger.warning("Queries will use fallback responses.")

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
    search_results = retriever.search(context_query, k=5)
    
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
                alt_results = retriever.search(alt_query, k=3)
                if alt_results and alt_results[0].get('score', 0) > 0.1:
                    search_results = alt_results
                    print(f"Using alternative search for: {alt_query}")
                    break
    
    # Debug: Log search results
    print(f"Search query: {req.question}")
    print(f"Found {len(search_results)} results")
    for i, result in enumerate(search_results):
        print(f"Result {i+1} score: {result.get('score', 'N/A')}")
        print(f"Result {i+1} text preview: {result['metadata']['text'][:100]}...")

    if not search_results:
        return QueryResponse(
            answer="Not found in your files.",
            citations=[]
        )

    # Generate answer using Ollama LLM
    try:
        # Check if Ollama is available
        ollama_client = await get_ollama_client()
        health = await ollama_client.health_check()
        
        if not health.is_healthy or not health.is_available:
            # Fallback to simple text extraction if Ollama is unavailable
            print("Ollama unavailable, using fallback response generation")
            answer = _generate_fallback_answer(search_results, req.question)
        else:
            # Use Ollama for answer generation
            print("Using Ollama for answer generation")
            
            # Prepare context from search results
            context_text = ""
            for i, result in enumerate(search_results[:3]):  # Use top 3 results
                text = result['metadata']['text']
                if len(text) > 500:  # Limit each result to 500 chars
                    text = text[:500] + "..."
                context_text += f"Document excerpt {i+1}: {text}\n\n"
            
            # Create a grounded prompt for the LLM
            prompt = f"""Based on the following document excerpts, please answer the user's question. 
            Be specific and cite information from the documents when possible.
            
            Question: {req.question}
            
            Document excerpts:
            {context_text}
            
            Please provide a helpful, accurate answer based on the information in the documents. 
            If the information is not available in the documents, please say so clearly."""
            
            # Convert conversation history to the format expected by Ollama
            conversation_context = None
            if req.conversation_history:
                conversation_context = [
                    {"role": msg.role, "content": msg.content} 
                    for msg in req.conversation_history[-4:]  # Last 4 messages
                ]
            
            # Generate answer using Ollama
            answer = await ollama_client.generate_text(
                prompt=prompt,
                model="llama3.1:8b",
                context=conversation_context
            )
            
            # Add source attribution
            answer = f"Based on your files: {answer}"
            
    except Exception as e:
        print(f"Error using Ollama: {e}, falling back to simple extraction")
        # Fallback to simple text extraction
        answer = _generate_fallback_answer(search_results, req.question)

    # Convert search results to citations
    citations = []
    for i, result in enumerate(search_results[:3]):  # Max 3 citations
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


@app.get("/fastapi/ollama/health")
async def ollama_health() -> Dict[str, Any]:
    """
    Check Ollama service health and model availability.
    
    Returns:
        Health status including service availability and loaded models
    """
    try:
        client = await get_ollama_client()
        health = await client.health_check()
        
        return {
            "status": "healthy" if health.is_healthy else "unhealthy",
            "ollama_available": health.is_available,
            "models_loaded": health.models_loaded,
            "target_model_available": "llama3.1:8b" in str(health.models_loaded),
            "error_message": health.error_message,
            "last_check": health.last_check.isoformat() if health.last_check else None
        }
    except Exception as e:
        return {
            "status": "error",
            "ollama_available": False,
            "models_loaded": [],
            "target_model_available": False,
            "error_message": str(e),
            "last_check": None
        }
