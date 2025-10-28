"""Tests for OpenAI-related API endpoints."""

from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.openai_client import OpenAIHealth
from datetime import datetime

client = TestClient(app)


def test_openai_health_endpoint_structure():
    """Test OpenAI health endpoint returns correct structure."""
    with patch('app.main.get_openai_client') as mock_get_client:
        # Mock the health check
        mock_client = AsyncMock()
        mock_health = OpenAIHealth(
            is_healthy=True,
            is_available=True,
            model="gpt-4o-mini",
            last_check=datetime.now()
        )
        mock_client.health_check.return_value = mock_health
        mock_get_client.return_value = mock_client
        
        response = client.get("/fastapi/openai/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "status" in data
        assert "api_available" in data
        assert "model" in data
        assert "error_message" in data
        assert "last_check" in data


def test_openai_health_endpoint_healthy():
    """Test OpenAI health endpoint when service is healthy."""
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_health = OpenAIHealth(
            is_healthy=True,
            is_available=True,
            model="gpt-4o-mini",
            last_check=datetime.now()
        )
        mock_client.health_check.return_value = mock_health
        mock_get_client.return_value = mock_client
        
        response = client.get("/fastapi/openai/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert data["api_available"] is True
        assert data["model"] == "gpt-4o-mini"
        assert data["error_message"] is None


def test_openai_health_endpoint_unhealthy():
    """Test OpenAI health endpoint when service is unhealthy."""
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_health = OpenAIHealth(
            is_healthy=False,
            is_available=False,
            model="gpt-4o-mini",
            error_message="Authentication failed",
            last_check=datetime.now()
        )
        mock_client.health_check.return_value = mock_health
        mock_get_client.return_value = mock_client
        
        response = client.get("/fastapi/openai/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "unhealthy"
        assert data["api_available"] is False
        assert data["error_message"] == "Authentication failed"


def test_openai_health_endpoint_error():
    """Test OpenAI health endpoint when exception occurs."""
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_get_client.side_effect = Exception("Network error")
        
        response = client.get("/fastapi/openai/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "error"
        assert data["api_available"] is False
        assert "Network error" in data["error_message"]

