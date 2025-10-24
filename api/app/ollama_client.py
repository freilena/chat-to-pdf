"""
Ollama client wrapper for FastAPI integration.

This module provides a client for interacting with the Ollama service,
including health checking, model management, and text generation.
"""

import os
import asyncio
import aiohttp
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

@dataclass
class OllamaModel:
    """Represents an Ollama model."""
    name: str
    size: int
    digest: str
    modified_at: datetime

@dataclass
class OllamaHealth:
    """Represents Ollama service health status."""
    is_healthy: bool
    is_available: bool
    models_loaded: List[str]
    error_message: Optional[str] = None
    last_check: Optional[datetime] = None

class OllamaClient:
    """Client for interacting with Ollama service."""
    
    def __init__(self, base_url: Optional[str] = None, timeout: int = 30):
        """
        Initialize Ollama client.
        
        Args:
            base_url: Ollama service URL (defaults to environment variable)
            timeout: Request timeout in seconds
        """
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.timeout = timeout
        self.session: Optional[aiohttp.ClientSession] = None
        self._health_cache: Optional[OllamaHealth] = None
        self._cache_duration = timedelta(seconds=30)  # Cache health for 30 seconds
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self._ensure_session()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    async def _ensure_session(self):
        """Ensure HTTP session is created."""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self.session = aiohttp.ClientSession(timeout=timeout)
    
    async def close(self):
        """Close HTTP session."""
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request to Ollama service.
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            **kwargs: Additional request parameters
            
        Returns:
            JSON response data
            
        Raises:
            aiohttp.ClientError: If request fails
        """
        await self._ensure_session()
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        
        try:
            async with self.session.request(method, url, **kwargs) as response:
                response.raise_for_status()
                return await response.json()
        except aiohttp.ClientError as e:
            logger.error(f"Ollama request failed: {e}")
            raise
    
    async def health_check(self, use_cache: bool = True) -> OllamaHealth:
        """
        Check Ollama service health.
        
        Args:
            use_cache: Whether to use cached health status
            
        Returns:
            OllamaHealth object with service status
        """
        # Return cached result if available and not expired
        if (use_cache and self._health_cache and 
            self._health_cache.last_check and 
            datetime.now() - self._health_cache.last_check < self._cache_duration):
            return self._health_cache
        
        try:
            # Check if Ollama service is responsive
            models_response = await self._make_request("GET", "/api/tags")
            models = models_response.get("models", [])
            
            # Check if our target model is available
            target_model = "llama3.1:8b"
            models_loaded = [model["name"] for model in models]
            is_model_available = any(target_model in model for model in models_loaded)
            
            health = OllamaHealth(
                is_healthy=True,
                is_available=True,
                models_loaded=models_loaded,
                last_check=datetime.now()
            )
            
            if not is_model_available:
                health.is_healthy = False
                health.error_message = f"Target model {target_model} not found. Available models: {models_loaded}"
            
            self._health_cache = health
            return health
            
        except Exception as e:
            error_msg = f"Ollama service unavailable: {str(e)}"
            logger.error(error_msg)
            
            health = OllamaHealth(
                is_healthy=False,
                is_available=False,
                models_loaded=[],
                error_message=error_msg,
                last_check=datetime.now()
            )
            
            self._health_cache = health
            return health
    
    async def generate_text(self, prompt: str, model: str = "llama3.1:8b", 
                          context: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Generate text using Ollama model.
        
        Args:
            prompt: Input prompt
            model: Model name to use
            context: Optional conversation context
            
        Returns:
            Generated text response
            
        Raises:
            aiohttp.ClientError: If generation fails
        """
        # Build the full prompt with context if provided
        full_prompt = prompt
        if context:
            context_text = "\n".join([
                f"{msg['role'].capitalize()}: {msg['content']}" 
                for msg in context
            ])
            full_prompt = f"Context from previous conversation:\n{context_text}\n\nCurrent question: {prompt}"
        
        payload = {
            "model": model,
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 1000
            }
        }
        
        try:
            response = await self._make_request("POST", "/api/generate", json=payload)
            return response.get("response", "")
        except Exception as e:
            logger.error(f"Text generation failed: {e}")
            raise
    
    async def get_models(self) -> List[OllamaModel]:
        """
        Get list of available models.
        
        Returns:
            List of OllamaModel objects
        """
        try:
            response = await self._make_request("GET", "/api/tags")
            models = []
            
            for model_data in response.get("models", []):
                model = OllamaModel(
                    name=model_data["name"],
                    size=model_data.get("size", 0),
                    digest=model_data.get("digest", ""),
                    modified_at=datetime.fromisoformat(
                        model_data.get("modified_at", "1970-01-01T00:00:00Z").replace("Z", "+00:00")
                    )
                )
                models.append(model)
            
            return models
            
        except Exception as e:
            logger.error(f"Failed to get models: {e}")
            return []

# Global client instance
_ollama_client: Optional[OllamaClient] = None

async def get_ollama_client() -> OllamaClient:
    """
    Get global Ollama client instance.
    
    Returns:
        OllamaClient instance
    """
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaClient()
    return _ollama_client

async def close_ollama_client():
    """Close global Ollama client."""
    global _ollama_client
    if _ollama_client:
        await _ollama_client.close()
        _ollama_client = None

