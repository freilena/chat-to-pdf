"""
Simple smoke test for OpenAI integration.

This test makes ONE real OpenAI API call to verify the integration works.
Cost: ~$0.000001 (one millionth of a dollar)

Run with: pytest tests/test_openai_smoke.py -v -s
"""

import pytest
import os
import requests

# Skip if OPENAI_API_KEY not set
pytestmark = pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set - skipping real API test"
)

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")


def test_openai_connection_smoke_test():
    """
    Minimal smoke test: Verify OpenAI API key is valid and service is reachable.
    
    This makes ONE real OpenAI API call (1 token) to validate connectivity.
    Cost: ~$0.000001
    """
    print("\n🔍 OpenAI Smoke Test: Checking connection...")
    
    # Call health endpoint (makes real API call with 1 token)
    response = requests.get(f"{API_BASE_URL}/fastapi/openai/health")
    
    assert response.status_code == 200, f"Health endpoint failed: {response.status_code}"
    
    data = response.json()
    print(f"   Status: {data['status']}")
    print(f"   Model: {data['model']}")
    print(f"   Available: {data['api_available']}")
    
    # Verify OpenAI is healthy
    assert data['status'] == 'healthy', \
        f"OpenAI not healthy: {data.get('error_message')}"
    assert data['api_available'] is True, "OpenAI API not available"
    assert data['model'] in ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'], \
        f"Unexpected model: {data['model']}"
    assert data['error_message'] is None, \
        f"Error message present: {data['error_message']}"
    
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


if __name__ == "__main__":
    """Run smoke test standalone."""
    print("="*60)
    print("OpenAI Integration Smoke Test")
    print("="*60)
    
    test_openai_key_format()
    test_openai_model_configured()
    test_openai_connection_smoke_test()
    
    print("\n" + "="*60)
    print("✅ All smoke tests passed!")
    print("="*60)

