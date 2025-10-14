from __future__ import annotations

import asyncio
import io
import uuid
from typing import Dict

from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.responses import JSONResponse
from pypdf import PdfReader
from pydantic import BaseModel
from app.retrieval import HybridRetriever, chunk_text

app = FastAPI(title="Chat-To-PDF API")

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
    return {"status": "ok"}


@app.post("/fastapi/upload")
async def upload_files(files: list[UploadFile] = File(...)):
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
        try:
            reader = PdfReader(io.BytesIO(data))
        except Exception:
            raise HTTPException(status_code=400, detail=f"{name} is not a valid PDF")
        num_pages = len(reader.pages)
        if num_pages > MAX_PAGES_PER_PDF:
            raise HTTPException(status_code=400, detail=f"{name} exceeds {MAX_PAGES_PER_PDF} pages")
        # Check first few pages for any text
        has_text = False
        pages_to_check = min(num_pages, 3)
        for i in range(pages_to_check):
            try:
                text = reader.pages[i].extract_text() or ""
            except Exception:
                text = ""
            if text.strip():
                has_text = True
                break
        if not has_text:
            raise HTTPException(status_code=400, detail=f"{name} appears scanned/unsearchable (no text layer)")

    SESSION_STATUS[session_id] = {
        "status": "indexing",
        "total_files": len(files),
        "files_indexed": 0,
    }

    # Create hybrid retriever for this session
    retriever = HybridRetriever()
    SESSION_RETRIEVERS[session_id] = retriever

    # Background indexing: process PDFs and add to retriever
    async def do_indexing(sid: str, file_buffers: list[tuple[str, bytes]]) -> None:
        try:
            for i, (filename, data) in enumerate(file_buffers):
                # Extract text from PDF
                reader = PdfReader(io.BytesIO(data))
                full_text = ""
                for page_num, page in enumerate(reader.pages):
                    try:
                        page_text = page.extract_text() or ""
                        full_text += page_text + "\n"
                    except Exception:
                        continue
                
                # Chunk the text
                chunks = chunk_text(full_text)
                
                # Add each chunk to the retriever
                for chunk_idx, chunk in enumerate(chunks):
                    metadata = {
                        "doc_id": filename,
                        "chunk_id": chunk_idx,
                        "page": 1,  # Simplified for MVP
                        "sentenceSpan": (0, len(chunk["text"])),  # Simplified
                    }
                    retriever.add_document(chunk["text"], metadata)
                
                # Update progress
                state = SESSION_STATUS.get(sid)
                if not state:
                    return
                state["files_indexed"] = i + 1
                await asyncio.sleep(0.1)  # Small delay to show progress
            
            # Mark as done
            state = SESSION_STATUS.get(sid)
            if state:
                state["status"] = "done"
        except Exception:
            state = SESSION_STATUS.get(sid)
            if state:
                state["status"] = "error"

    asyncio.create_task(do_indexing(session_id, file_buffers))

    return JSONResponse(
        {
            "session_id": session_id,
            "totals": {"files": len(files), "bytes": total_bytes},
        }
    )


@app.get("/fastapi/index/status")
async def index_status(session_id: str = Query(...)):
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
    session_id: str
    question: str


class Citation(BaseModel):
    file: str
    page: int
    sentenceSpan: tuple[int, int]
    id: str


class QueryResponse(BaseModel):
    answer: str
    citations: list[Citation]


@app.post("/fastapi/query")
async def query(req: QueryRequest) -> QueryResponse:
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
    
    # For MVP, return a simple answer based on the top result
    # TODO: Integrate with Ollama for proper answer generation
    top_result = search_results[0]
    answer = f"Based on your files: {top_result['metadata']['text'][:200]}..."
    
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
