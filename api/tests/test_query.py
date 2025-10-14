import io
from fastapi.testclient import TestClient
from app.main import app, SESSION_STATUS, SESSION_RETRIEVERS


client = TestClient(app)


def test_query_endpoint_returns_answer_and_citations():
    # Create a session directly without going through PDF upload
    session_id = "test-session-123"
    
    # Set up session status
    SESSION_STATUS[session_id] = {
        "status": "done",
        "total_files": 1,
        "files_indexed": 1,
    }
    
    # Create and populate a retriever directly
    from app.retrieval import HybridRetriever
    retriever = HybridRetriever()
    retriever.add_document(
        "Test PDF content about policies and procedures.",
        {"doc_id": "test.pdf", "chunk_id": 0, "page": 1, "sentenceSpan": (0, 50)}
    )
    SESSION_RETRIEVERS[session_id] = retriever
    
    # Now query the session
    payload = {"session_id": session_id, "question": "What is the policy?"}
    resp = client.post("/fastapi/query", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "answer" in data and isinstance(data["answer"], str)
    assert "citations" in data and isinstance(data["citations"], list)
    # Each citation object (if present) should carry required fields
    for c in data["citations"]:
        assert set(["file", "page", "sentenceSpan", "id"]).issubset(c.keys())


def test_query_endpoint_session_not_found():
    payload = {"session_id": "nonexistent-session", "question": "What is the policy?"}
    resp = client.post("/fastapi/query", json=payload)
    assert resp.status_code == 404
    assert "Session not found" in resp.json()["detail"]


def test_query_endpoint_session_still_indexing():
    # Create a session but leave it in indexing state
    session_id = "test-session-indexing"
    
    # Set up session status as still indexing
    SESSION_STATUS[session_id] = {
        "status": "indexing",
        "total_files": 1,
        "files_indexed": 0,
    }
    
    # Query while still indexing
    payload = {"session_id": session_id, "question": "What is the policy?"}
    resp = client.post("/fastapi/query", json=payload)
    assert resp.status_code == 400
    assert "still indexing" in resp.json()["detail"]


