"""
Simple smoke test for OpenAI integration.

This test makes ONE real OpenAI API call to verify the integration works.
Cost: ~$0.000001 (one millionth of a dollar)

Run with: pytest tests/test_openai_smoke.py -v -s
"""

import pytest
import os
from app.openai_client import OpenAIClient

# Skip if OPENAI_API_KEY not set
pytestmark = pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set - skipping real API test"
)


@pytest.mark.asyncio
async def test_openai_connection_smoke_test():
    """
    Minimal smoke test: Verify OpenAI API key is valid and service is reachable.
    
    This makes ONE real OpenAI API call (1 token) to validate connectivity.
    Cost: ~$0.000001
    """
    print("\n🔍 OpenAI Smoke Test: Checking connection...")
    
    # Create OpenAI client and test health
    client = OpenAIClient()
    health = await client.health_check(use_cache=False)
    
    print(f"   Status: {'healthy' if health.is_healthy else 'unhealthy'}")
    print(f"   Model: {health.model}")
    print(f"   Available: {health.is_available}")
    
    # Verify OpenAI is healthy
    assert health.is_healthy is True, \
        f"OpenAI not healthy: {health.error_message}"
    assert health.is_available is True, "OpenAI API not available"
    assert health.model in ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'gpt-4-turbo'], \
        f"Unexpected model: {health.model}"
    assert health.error_message is None, \
        f"Error message present: {health.error_message}"
    
    print("   ✅ OpenAI connection verified!")
    print(f"   Cost: ~$0.000001")


def test_openai_key_format():
    """Verify OPENAI_API_KEY has correct format."""
    api_key = os.getenv("OPENAI_API_KEY")
    
    print("\n🔑 Checking API key format...")
    
    assert api_key is not None, "OPENAI_API_KEY not set"
    assert len(api_key) > 20, "API key too short"
    assert api_key.startswith("sk-"), \
        f"API key should start with 'sk-', got: {api_key[:5]}..."
    
    print(f"   ✅ API key format valid: {api_key[:8]}...{api_key[-4:]}")


def test_openai_model_configured():
    """Verify OPENAI_MODEL is set (optional)."""
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    print(f"\n⚙️  Model configured: {model}")
    
    assert model in ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'], \
        f"Unexpected model: {model}"
    
    print(f"   ✅ Model configuration valid")
