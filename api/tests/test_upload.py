import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_upload_creates_session_and_returns_id():
    files = [
        ("files", ("a.pdf", io.BytesIO(b"%PDF-1.4\n..."), "application/pdf")),
        ("files", ("b.pdf", io.BytesIO(b"%PDF-1.4\n..."), "application/pdf")),
    ]
    resp = client.post("/fastapi/upload", files=files)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "session_id" in data
    assert data["totals"]["files"] == 2
    assert data["totals"]["bytes"] > 0


def test_index_status_initial_indexing():
    files = [("files", ("a.pdf", io.BytesIO(b"%PDF-1.4\n..."), "application/pdf"))]
    up = client.post("/fastapi/upload", files=files)
    session_id = up.json()["session_id"]
    st = client.get(f"/fastapi/index/status", params={"session_id": session_id})
    assert st.status_code == 200, st.text
    sdata = st.json()
    assert sdata["status"] in {"queued", "indexing", "done"}
    assert sdata["total_files"] == 1
    assert sdata["files_indexed"] <= sdata["total_files"]
