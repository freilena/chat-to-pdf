from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_query_endpoint_returns_answer_and_citations():
    # Using a dummy session id for now
    payload = {"session_id": "test-session", "question": "What is the policy?"}
    resp = client.post("/fastapi/query", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "answer" in data and isinstance(data["answer"], str)
    assert "citations" in data and isinstance(data["citations"], list)
    # Each citation object (if present) should carry required fields
    for c in data["citations"]:
        assert set(["file", "page", "sentenceSpan", "id"]).issubset(c.keys())


