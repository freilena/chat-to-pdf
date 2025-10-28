"""Tests for OpenAI client functionality."""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
from app.openai_client import OpenAIClient, OpenAIHealth, get_openai_client
import openai


class TestOpenAIClient:
    """Test OpenAI client functionality."""

    @pytest.fixture
    def client(self):
        """Create OpenAI client for testing."""
        return OpenAIClient(api_key="test-key-12345", model="gpt-4o-mini")

    def test_client_initialization(self):
        """Test client initialization with explicit API key."""
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        assert client.api_key == "test-key"
        assert client.model == "gpt-4o-mini"

    def test_client_initialization_from_env(self, monkeypatch):
        """Test client initialization from environment variable."""
        monkeypatch.setenv("OPENAI_API_KEY", "env-key-12345")
        client = OpenAIClient()
        assert client.api_key == "env-key-12345"
        assert client.model == "gpt-4o-mini"  # default model

    @pytest.mark.asyncio
    async def test_health_check_success(self, client):
        """Test successful health check."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="test"))]
        
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(return_value=mock_response)):
            health = await client.health_check()
            
            assert health.is_healthy is True
            assert health.is_available is True
            assert health.model == "gpt-4o-mini"
            assert health.error_message is None
            assert isinstance(health.last_check, datetime)

    @pytest.mark.asyncio
    async def test_health_check_auth_error(self, client):
        """Test health check with authentication error."""
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(
            side_effect=openai.error.AuthenticationError("Invalid API key")
        )):
            health = await client.health_check()
            
            assert health.is_healthy is False
            assert health.is_available is False
            assert "authentication failed" in health.error_message.lower()

    @pytest.mark.asyncio
    async def test_health_check_general_error(self, client):
        """Test health check with general error."""
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(
            side_effect=Exception("Network error")
        )):
            health = await client.health_check()
            
            assert health.is_healthy is False
            assert health.is_available is False
            assert "unavailable" in health.error_message.lower()

    @pytest.mark.asyncio
    async def test_health_check_caching(self, client):
        """Test health check result caching."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="test"))]
        
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(return_value=mock_response)) as mock_create:
            # First call - should make API call
            health1 = await client.health_check()
            assert mock_create.call_count == 1
            
            # Second call within 30 seconds - should use cache
            health2 = await client.health_check(use_cache=True)
            assert mock_create.call_count == 1  # No additional call
            
            assert health1.last_check == health2.last_check

    @pytest.mark.asyncio
    async def test_health_check_cache_disabled(self, client):
        """Test health check with caching disabled."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="test"))]
        
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(return_value=mock_response)) as mock_create:
            # First call
            await client.health_check()
            assert mock_create.call_count == 1
            
            # Second call with cache disabled - should make new API call
            await client.health_check(use_cache=False)
            assert mock_create.call_count == 2

    @pytest.mark.asyncio
    async def test_generate_text_simple(self, client):
        """Test simple text generation."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Generated response"))]
        
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(return_value=mock_response)) as mock_create:
            result = await client.generate_text("Test prompt")
            
            assert result == "Generated response"
            assert mock_create.call_count == 1
            
            # Verify API call parameters
            call_args = mock_create.call_args
            assert call_args.kwargs['model'] == 'gpt-4o-mini'
            assert call_args.kwargs['max_tokens'] == 250
            assert call_args.kwargs['temperature'] == 0.7
            assert len(call_args.kwargs['messages']) == 1
            assert call_args.kwargs['messages'][0]['content'] == "Test prompt"

    @pytest.mark.asyncio
    async def test_generate_text_with_context(self, client):
        """Test text generation with conversation context."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Response with context"))]
        
        context = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there!"},
            {"role": "user", "content": "How are you?"}
        ]
        
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(return_value=mock_response)) as mock_create:
            result = await client.generate_text("Tell me more", context=context)
            
            assert result == "Response with context"
            
            # Verify context is included (last 4 messages)
            call_args = mock_create.call_args
            messages = call_args.kwargs['messages']
            assert len(messages) == 4  # 3 from context + 1 current
            assert messages[-1]['content'] == "Tell me more"

    @pytest.mark.asyncio
    async def test_generate_text_with_long_context(self, client):
        """Test text generation truncates context to last 4 messages."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Response"))]
        
        # Create 6 messages in context
        context = [
            {"role": "user", "content": f"Message {i}"}
            for i in range(6)
        ]
        
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(return_value=mock_response)) as mock_create:
            await client.generate_text("Current prompt", context=context)
            
            # Should only include last 4 from context + current prompt
            call_args = mock_create.call_args
            messages = call_args.kwargs['messages']
            assert len(messages) == 5  # 4 from context + 1 current

    @pytest.mark.asyncio
    async def test_generate_text_custom_max_tokens(self, client):
        """Test text generation with custom max_tokens."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Short response"))]
        
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(return_value=mock_response)) as mock_create:
            await client.generate_text("Test", max_tokens=100)
            
            call_args = mock_create.call_args
            assert call_args.kwargs['max_tokens'] == 100

    @pytest.mark.asyncio
    async def test_generate_text_auth_error(self, client):
        """Test text generation with authentication error."""
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(
            side_effect=openai.error.AuthenticationError("Invalid API key")
        )):
            with pytest.raises(Exception) as exc_info:
                await client.generate_text("Test")
            
            assert "authentication failed" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generate_text_rate_limit_error(self, client):
        """Test text generation with rate limit error."""
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(
            side_effect=openai.error.RateLimitError("Rate limit exceeded")
        )):
            with pytest.raises(Exception) as exc_info:
                await client.generate_text("Test")
            
            assert "rate limit" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_generate_text_general_error(self, client):
        """Test text generation with general error."""
        with patch.object(openai.ChatCompletion, 'acreate', new=AsyncMock(
            side_effect=Exception("Network error")
        )):
            with pytest.raises(Exception) as exc_info:
                await client.generate_text("Test")
            
            assert "generation failed" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_get_openai_client_singleton(self):
        """Test that get_openai_client returns singleton instance."""
        client1 = await get_openai_client()
        client2 = await get_openai_client()
        
        assert client1 is client2

