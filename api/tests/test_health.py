from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_healthz():
    resp = client.get("/healthz")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert isinstance(data["version"], str)
