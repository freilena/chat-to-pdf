from __future__ import annotations

import io
import uuid
from typing import Dict

from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI(title="Chat-To-PDF API")

# In-memory session store for MVP/TDD
SESSION_STATUS: Dict[str, Dict[str, int | str]] = {}


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.post("/fastapi/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    session_id = str(uuid.uuid4())

    total_bytes = 0
    for f in files:
        # Read small buffers to compute size without keeping file handles open
        content = await f.read()
        total_bytes += len(content)
        # Reset file for any later processing (not used yet)
        f.file = io.BytesIO(content)

    SESSION_STATUS[session_id] = {
        "status": "indexing",
        "total_files": len(files),
        "files_indexed": 0,
    }

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
