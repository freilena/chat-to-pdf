"""
OpenAI client wrapper for FastAPI integration.

This module provides a client for interacting with OpenAI API,
including health checking and text generation.
"""

import os
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime
import openai

logger = logging.getLogger(__name__)

@dataclass
class OpenAIHealth:
    """Represents OpenAI service health status."""
    is_healthy: bool
    is_available: bool
    model: str
    error_message: Optional[str] = None
    last_check: Optional[datetime] = None

class OpenAIClient:
    """Client for interacting with OpenAI API."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4o-mini"):
        """
        Initialize OpenAI client.
        
        Args:
            api_key: OpenAI API key (defaults to environment variable)
            model: Model to use (default: gpt-4o-mini for cost efficiency)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = model
        
        if not self.api_key:
            logger.warning("OPENAI_API_KEY not set")
        
        # Initialize OpenAI client
        openai.api_key = self.api_key
        self._health_cache: Optional[OpenAIHealth] = None
    
    async def health_check(self, use_cache: bool = True) -> OpenAIHealth:
        """
        Check OpenAI API health.
        
        Args:
            use_cache: Whether to use cached health status
            
        Returns:
            OpenAIHealth object with service status
        """
        # Return cached result if available (within 30 seconds)
        if use_cache and self._health_cache and self._health_cache.last_check:
            time_since_check = datetime.now() - self._health_cache.last_check
            if time_since_check.total_seconds() < 30:
                return self._health_cache
        
        try:
            # Simple test to verify API is accessible
            # Using minimal tokens to keep costs low
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1  # Minimal to reduce cost
            )
            
            health = OpenAIHealth(
                is_healthy=True,
                is_available=True,
                model=self.model,
                last_check=datetime.now()
            )
            
            self._health_cache = health
            return health
            
        except openai.error.AuthenticationError as e:
            error_msg = f"OpenAI authentication failed: {str(e)}"
            logger.error(error_msg)
            
            health = OpenAIHealth(
                is_healthy=False,
                is_available=False,
                model=self.model,
                error_message=error_msg,
                last_check=datetime.now()
            )
            
            self._health_cache = health
            return health
            
        except Exception as e:
            error_msg = f"OpenAI service unavailable: {str(e)}"
            logger.error(error_msg)
            
            health = OpenAIHealth(
                is_healthy=False,
                is_available=False,
                model=self.model,
                error_message=error_msg,
                last_check=datetime.now()
            )
            
            self._health_cache = health
            return health
    
    async def generate_text(
        self, 
        prompt: str, 
        context: Optional[List[Dict[str, str]]] = None,
        max_tokens: int = 250
    ) -> str:
        """
        Generate text using OpenAI API.
        
        Args:
            prompt: Input prompt
            context: Optional conversation context
            max_tokens: Maximum tokens to generate (default: 250 for ~150 words)
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If generation fails
        """
        messages = []
        
        # Add conversation context if provided (last 4 messages for efficiency)
        if context:
            for msg in context[-4:]:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        # Add current prompt
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = await openai.ChatCompletion.acreate(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7,  # Balanced creativity/consistency
                top_p=0.9
            )
            
            return response.choices[0].message.content
            
        except openai.error.AuthenticationError as e:
            logger.error(f"OpenAI authentication failed: {e}")
            raise Exception(f"OpenAI authentication failed: {e}")
            
        except openai.error.RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise Exception(f"OpenAI rate limit exceeded: {e}")
            
        except Exception as e:
            logger.error(f"Text generation failed: {e}")
            raise Exception(f"OpenAI generation failed: {e}")

# Global client instance
_openai_client: Optional[OpenAIClient] = None

async def get_openai_client() -> OpenAIClient:
    """
    Get global OpenAI client instance.
    
    Returns:
        OpenAIClient instance
    """
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAIClient()
    return _openai_client

async def close_openai_client():
    """Close global OpenAI client (cleanup)."""
    global _openai_client
    _openai_client = None

