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
from app.retrieval import HybridRetriever, chunk_text


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


class QueryRequest(BaseModel):
    """Request model for querying documents."""
    session_id: str
    question: str


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

    # Search for relevant chunks
    search_results = retriever.search(req.question, k=5)

    if not search_results:
        return QueryResponse(
            answer="Not found in your files.",
            citations=[]
        )

    # For MVP, return a more comprehensive answer based on search results
    # TODO: Integrate with Ollama for proper answer generation
    if len(search_results) == 1:
        # Single result - return more context
        top_result = search_results[0]
        text = top_result['metadata']['text']
        # Return up to 1000 characters instead of 200
        if len(text) > 1000:
            answer = f"Based on your files: {text[:1000]}..."
        else:
            answer = f"Based on your files: {text}"
    else:
        # Multiple results - combine them for better context
        combined_text = ""
        for i, result in enumerate(search_results[:3]):  # Use top 3 results
            text = result['metadata']['text']
            if len(text) > 300:  # Limit each result to 300 chars
                text = text[:300] + "..."
            combined_text += f"Result {i+1}: {text}\n\n"
        
        if len(combined_text) > 1500:
            combined_text = combined_text[:1500] + "..."
        
        answer = f"Based on your files:\n\n{combined_text}"

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
