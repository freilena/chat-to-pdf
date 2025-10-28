from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_healthz():
    """Test basic health check endpoint."""
    resp = client.get("/healthz")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert isinstance(data["version"], str)

def test_ollama_health_endpoint_structure():
    """Test Ollama health endpoint structure."""
    resp = client.get("/fastapi/ollama/health")
    assert resp.status_code == 200
    data = resp.json()
    
    # Verify response structure
    assert "status" in data
    assert "ollama_available" in data
    assert "models_loaded" in data
    assert "target_model_available" in data
    assert "error_message" in data
    assert "last_check" in data
    
    # Verify response types
    assert isinstance(data["status"], str)
    assert isinstance(data["ollama_available"], bool)
    assert isinstance(data["models_loaded"], list)
    assert isinstance(data["target_model_available"], bool)
