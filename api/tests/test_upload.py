import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def create_minimal_pdf() -> bytes:
    """Create a minimal valid PDF for testing."""
    return b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length 20
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test content) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
0000000300 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
370
%%EOF"""


def test_upload_creates_session_and_returns_id():
    pdf_content = create_minimal_pdf()
    files = [
        ("files", ("a.pdf", io.BytesIO(pdf_content), "application/pdf")),
        ("files", ("b.pdf", io.BytesIO(pdf_content), "application/pdf")),
    ]
    resp = client.post("/fastapi/upload", files=files)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "session_id" in data
    assert data["totals"]["files"] == 2
    assert data["totals"]["bytes"] > 0


def test_index_status_initial_indexing():
    pdf_content = create_minimal_pdf()
    files = [("files", ("a.pdf", io.BytesIO(pdf_content), "application/pdf"))]
    up = client.post("/fastapi/upload", files=files)
    session_id = up.json()["session_id"]
    st = client.get("/fastapi/index/status", params={"session_id": session_id})
    assert st.status_code == 200, st.text
    sdata = st.json()
    assert sdata["status"] in {"queued", "indexing", "done"}
    assert sdata["total_files"] == 1
    assert sdata["files_indexed"] <= sdata["total_files"]
