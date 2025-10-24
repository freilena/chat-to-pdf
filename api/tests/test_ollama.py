"""
Tests for Ollama client and health check functionality.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

from app.ollama_client import OllamaClient, OllamaHealth, get_ollama_client
from app.main import ollama_health


class TestOllamaClient:
    """Test Ollama client functionality."""
    
    @pytest.fixture
    def client(self):
        """Create Ollama client for testing."""
        return OllamaClient(base_url="http://test-ollama:11434", timeout=5)
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, client):
        """Test successful health check."""
        mock_response = {
            "models": [
                {"name": "llama3.1:8b", "size": 1000000000, "digest": "abc123"},
                {"name": "other-model", "size": 500000000, "digest": "def456"}
            ]
        }
        
        with patch.object(client, '_make_request', return_value=mock_response):
            health = await client.health_check()
            
            assert health.is_healthy is True
            assert health.is_available is True
            assert "llama3.1:8b" in health.models_loaded
            assert health.error_message is None
            assert health.last_check is not None
    
    @pytest.mark.asyncio
    async def test_health_check_model_not_found(self, client):
        """Test health check when target model is not found."""
        mock_response = {
            "models": [
                {"name": "other-model", "size": 500000000, "digest": "def456"}
            ]
        }
        
        with patch.object(client, '_make_request', return_value=mock_response):
            health = await client.health_check()
            
            assert health.is_healthy is False
            assert health.is_available is True
            assert "llama3.1:8b" not in health.models_loaded
            assert "Target model llama3.1:8b not found" in health.error_message
    
    @pytest.mark.asyncio
    async def test_health_check_service_unavailable(self, client):
        """Test health check when Ollama service is unavailable."""
        with patch.object(client, '_make_request', side_effect=Exception("Connection failed")):
            health = await client.health_check()
            
            assert health.is_healthy is False
            assert health.is_available is False
            assert health.models_loaded == []
            assert "Ollama service unavailable" in health.error_message
    
    @pytest.mark.asyncio
    async def test_generate_text_success(self, client):
        """Test successful text generation."""
        mock_response = {
            "response": "This is a test response from the model."
        }
        
        with patch.object(client, '_make_request', return_value=mock_response):
            result = await client.generate_text("Test prompt")
            
            assert result == "This is a test response from the model."
    
    @pytest.mark.asyncio
    async def test_generate_text_with_context(self, client):
        """Test text generation with conversation context."""
        mock_response = {
            "response": "This is a contextual response."
        }
        
        context = [
            {"role": "user", "content": "Previous question"},
            {"role": "assistant", "content": "Previous answer"}
        ]
        
        with patch.object(client, '_make_request', return_value=mock_response) as mock_request:
            result = await client.generate_text("Current question", context=context)
            
            assert result == "This is a contextual response."
            
            # Verify context was included in the request
            call_args = mock_request.call_args
            assert call_args[1]['json']['prompt'].startswith("Context from previous conversation:")
            assert "Previous question" in call_args[1]['json']['prompt']
            assert "Current question" in call_args[1]['json']['prompt']
    
    @pytest.mark.asyncio
    async def test_get_models_success(self, client):
        """Test successful model listing."""
        mock_response = {
            "models": [
                {
                    "name": "llama3.1:8b",
                    "size": 1000000000,
                    "digest": "abc123",
                    "modified_at": "2024-01-01T00:00:00Z"
                }
            ]
        }
        
        with patch.object(client, '_make_request', return_value=mock_response):
            models = await client.get_models()
            
            assert len(models) == 1
            assert models[0].name == "llama3.1:8b"
            assert models[0].size == 1000000000
            assert models[0].digest == "abc123"
    
    @pytest.mark.asyncio
    async def test_health_check_caching(self, client):
        """Test health check result caching."""
        mock_response = {
            "models": [{"name": "llama3.1:8b", "size": 1000000000, "digest": "abc123"}]
        }
        
        with patch.object(client, '_make_request', return_value=mock_response) as mock_request:
            # First call
            health1 = await client.health_check()
            # Second call (should use cache)
            health2 = await client.health_check()
            
            assert health1.is_healthy is True
            assert health2.is_healthy is True
            # Should only make one request due to caching
            assert mock_request.call_count == 1


class TestOllamaHealthEndpoint:
    """Test Ollama health check endpoint."""
    
    @pytest.mark.asyncio
    async def test_ollama_health_success(self):
        """Test successful health endpoint response."""
        mock_health = OllamaHealth(
            is_healthy=True,
            is_available=True,
            models_loaded=["llama3.1:8b", "other-model"],
            last_check=datetime.now()
        )
        
        with patch('app.main.get_ollama_client') as mock_get_client:
            mock_client = AsyncMock()
            mock_client.health_check.return_value = mock_health
            mock_get_client.return_value = mock_client
            
            result = await ollama_health()
            
            assert result["status"] == "healthy"
            assert result["ollama_available"] is True
            assert "llama3.1:8b" in result["models_loaded"]
            assert result["target_model_available"] is True
            assert result["error_message"] is None
    
    @pytest.mark.asyncio
    async def test_ollama_health_model_not_found(self):
        """Test health endpoint when target model is not found."""
        mock_health = OllamaHealth(
            is_healthy=False,
            is_available=True,
            models_loaded=["other-model"],
            error_message="Target model llama3.1:8b not found",
            last_check=datetime.now()
        )
        
        with patch('app.main.get_ollama_client') as mock_get_client:
            mock_client = AsyncMock()
            mock_client.health_check.return_value = mock_health
            mock_get_client.return_value = mock_client
            
            result = await ollama_health()
            
            assert result["status"] == "unhealthy"
            assert result["ollama_available"] is True
            assert result["target_model_available"] is False
            assert "Target model llama3.1:8b not found" in result["error_message"]
    
    @pytest.mark.asyncio
    async def test_ollama_health_service_error(self):
        """Test health endpoint when service is unavailable."""
        with patch('app.main.get_ollama_client', side_effect=Exception("Service unavailable")):
            result = await ollama_health()
            
            assert result["status"] == "error"
            assert result["ollama_available"] is False
            assert result["models_loaded"] == []
            assert result["target_model_available"] is False
            assert "Service unavailable" in result["error_message"]


class TestOllamaClientIntegration:
    """Integration tests for Ollama client."""
    
    @pytest.mark.asyncio
    async def test_client_context_manager(self):
        """Test Ollama client as async context manager."""
        with patch('aiohttp.ClientSession') as mock_session_class:
            mock_session = AsyncMock()
            mock_session_class.return_value = mock_session
            
            async with OllamaClient() as client:
                assert client.session is not None
            
            # Session should be closed after context
            mock_session.close.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_global_client_singleton(self):
        """Test global client singleton pattern."""
        with patch('app.ollama_client.OllamaClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client_class.return_value = mock_client
            
            # First call should create new client
            client1 = await get_ollama_client()
            # Second call should return same client
            client2 = await get_ollama_client()
            
            assert client1 is client2
            assert mock_client_class.call_count == 1

