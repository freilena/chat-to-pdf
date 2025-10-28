"""
Security and edge case tests for OpenAI integration.

These tests verify:
1. API key security and validation
2. Input sanitization and injection prevention
3. Rate limiting behavior
4. Error information disclosure
5. Configuration validation
"""

import pytest
import os
from unittest.mock import patch, AsyncMock, Mock
from app.openai_client import OpenAIClient, OpenAIHealth
from openai import AuthenticationError, RateLimitError


class TestAPIKeySecurity:
    """Test API key handling and security."""
    
    def test_api_key_not_logged_in_errors(self, capsys):
        """Test that API key is not exposed in error messages."""
        client = OpenAIClient(api_key="sk-secret-key-12345", model="gpt-4o-mini")
        
        # Get the string representation
        client_str = str(client)
        
        # API key should not be in string representation
        assert "sk-secret-key-12345" not in client_str
    
    def test_api_key_warning_when_missing(self, capsys):
        """Test that a warning is issued when API key is missing."""
        import logging
        from openai import OpenAIError
        
        with patch.dict(os.environ, {}, clear=True):
            # OpenAI client raises error if API key is not provided
            with pytest.raises(OpenAIError):
                client = OpenAIClient(api_key=None)
    
    def test_api_key_from_env_variable(self, monkeypatch):
        """Test that API key can be loaded from environment."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-env-key-abc123")
        
        client = OpenAIClient()
        
        assert client.api_key == "sk-env-key-abc123"
    
    def test_explicit_api_key_overrides_env(self, monkeypatch):
        """Test that explicit API key takes precedence over environment."""
        monkeypatch.setenv("OPENAI_API_KEY", "sk-env-key")
        
        client = OpenAIClient(api_key="sk-explicit-key")
        
        assert client.api_key == "sk-explicit-key"


class TestInputSanitization:
    """Test input validation and sanitization."""
    
    @pytest.mark.asyncio
    async def test_generate_text_with_very_long_prompt(self):
        """Test handling of extremely long prompts."""
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        
        # Create a very long prompt (10,000 characters)
        long_prompt = "A" * 10000
        
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Response"))]
        
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)):
            result = await client.generate_text(long_prompt)
            
            # Should handle without crashing
            assert result == "Response"
    
    @pytest.mark.asyncio
    async def test_generate_text_with_special_characters(self):
        """Test handling of special characters in prompts."""
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        
        # Prompt with special characters
        prompt = "What about: <script>alert('xss')</script> and SQL: '; DROP TABLE users; --"
        
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Safe response"))]
        
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)) as mock_create:
            result = await client.generate_text(prompt)
            
            # Should pass through without modification (OpenAI handles sanitization)
            assert result == "Safe response"
            
            # Verify the prompt was passed as-is
            call_args = mock_create.call_args
            assert call_args.kwargs['messages'][-1]['content'] == prompt
    
    @pytest.mark.asyncio
    async def test_generate_text_with_unicode(self):
        """Test handling of unicode characters."""
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        
        prompt = "What about emojis 😀🎉 and unicode: 你好世界 Привет мир"
        
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Unicode handled 🎯"))]
        
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)):
            result = await client.generate_text(prompt)
            
            assert result == "Unicode handled 🎯"
    
    @pytest.mark.asyncio
    async def test_generate_text_with_empty_prompt(self):
        """Test handling of empty prompt."""
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Empty prompt response"))]
        
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)):
            result = await client.generate_text("")
            
            # Should handle gracefully
            assert isinstance(result, str)


class TestRateLimitHandling:
    """Test rate limit and quota handling."""
    
    @pytest.mark.asyncio
    async def test_health_check_rate_limit_error(self):
        """Test health check behavior on rate limit."""
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(
            side_effect=RateLimitError("Rate limit exceeded", response=Mock(), body=None)
        )):
            health = await client.health_check(use_cache=False)
            
            # Should report as unhealthy
            assert health.is_healthy is False
            assert health.is_available is False
            assert "unavailable" in health.error_message.lower()
    
    @pytest.mark.asyncio
    async def test_generate_text_rate_limit_propagates(self):
        """Test that rate limit errors are properly propagated."""
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(
            side_effect=RateLimitError("Rate limit exceeded", response=Mock(), body=None)
        )):
            with pytest.raises(Exception) as exc_info:
                await client.generate_text("Test prompt")
            
            # Should indicate rate limit issue
            assert "rate limit" in str(exc_info.value).lower()


class TestErrorInformationDisclosure:
    """Test that errors don't leak sensitive information."""
    
    @pytest.mark.asyncio
    async def test_authentication_error_sanitized(self):
        """Test that authentication errors don't expose API key."""
        client = OpenAIClient(api_key="sk-secret-key-12345", model="gpt-4o-mini")
        
        error_msg = "Authentication failed for key sk-secret-key-12345"
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(
            side_effect=AuthenticationError(error_msg, response=Mock(), body=None)
        )):
            health = await client.health_check(use_cache=False)
            
            # Error message should not contain actual key
            assert "sk-secret-key-12345" not in health.error_message
            assert "authentication failed" in health.error_message.lower()
    
    @pytest.mark.asyncio
    async def test_generation_error_no_internal_details(self):
        """Test that generation errors don't expose internal implementation."""
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        
        internal_error = Exception("Internal server error at /internal/api/path with details")
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(
            side_effect=internal_error
        )):
            with pytest.raises(Exception) as exc_info:
                await client.generate_text("Test")
            
            # Error should be generic
            assert "generation failed" in str(exc_info.value).lower()


class TestConfigurationValidation:
    """Test configuration and model validation."""
    
    def test_default_model_configuration(self):
        """Test that default model is correctly set."""
        with patch.dict(os.environ, {}, clear=True):
            client = OpenAIClient(api_key="test-key")
            
            assert client.model == "gpt-4o-mini"
    
    def test_custom_model_configuration(self):
        """Test custom model configuration."""
        client = OpenAIClient(api_key="test-key", model="gpt-4o")
        
        assert client.model == "gpt-4o"
    
    def test_model_from_env_variable(self, monkeypatch):
        """Test model configuration from environment."""
        monkeypatch.setenv("OPENAI_MODEL", "gpt-4-turbo")
        
        client = OpenAIClient(api_key="test-key")
        
        assert client.model == "gpt-4-turbo"
    
    def test_explicit_model_overrides_env(self, monkeypatch):
        """Test that explicit model takes precedence."""
        monkeypatch.setenv("OPENAI_MODEL", "gpt-4o")
        
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        
        assert client.model == "gpt-4o-mini"
    
    @pytest.mark.asyncio
    async def test_health_check_uses_configured_model(self):
        """Test that health check uses the configured model."""
        client = OpenAIClient(api_key="test-key", model="gpt-4-turbo")
        
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="test"))]
        
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)) as mock_create:
            await client.health_check(use_cache=False)
            
            # Should use the configured model
            call_args = mock_create.call_args
            assert call_args.kwargs['model'] == 'gpt-4-turbo'


class TestConcurrency:
    """Test concurrent request handling."""
    
    @pytest.mark.asyncio
    async def test_multiple_concurrent_health_checks(self):
        """Test multiple concurrent health checks use caching properly."""
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="test"))]
        
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)) as mock_create:
            # First call
            health1 = await client.health_check()
            
            # Second call should use cache
            health2 = await client.health_check(use_cache=True)
            
            # Should only make one API call
            assert mock_create.call_count == 1
            
            # Results should be the same
            assert health1.is_healthy == health2.is_healthy
            assert health1.last_check == health2.last_check
    
    @pytest.mark.asyncio
    async def test_generate_text_handles_concurrent_calls(self):
        """Test that multiple generate_text calls can run concurrently."""
        import asyncio
        
        client = OpenAIClient(api_key="test-key", model="gpt-4o-mini")
        
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Response"))]
        
        with patch.object(client.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)) as mock_create:
            # Make 3 concurrent calls
            tasks = [
                client.generate_text("Prompt 1"),
                client.generate_text("Prompt 2"),
                client.generate_text("Prompt 3")
            ]
            
            results = await asyncio.gather(*tasks)
            
            # All should succeed
            assert len(results) == 3
            assert all(r == "Response" for r in results)
            
            # Should have made 3 separate API calls
            assert mock_create.call_count == 3

