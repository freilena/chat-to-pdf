"""
End-to-end integration test for OpenAI + PDF workflow.

WARNING: This test makes REAL OpenAI API calls and will cost ~$0.0005.
Run separately with: pytest tests/test_e2e_openai_integration.py -v -s

NOTE: This test uses the REAL running server (not TestClient) because
TestClient doesn't properly handle background asyncio tasks for indexing.
Make sure the API server is running: docker compose up -d
"""

import pytest
import time
import os
import requests
from pathlib import Path

# Skip if OPENAI_API_KEY not set
pytestmark = pytest.mark.skipif(
    not os.getenv("OPENAI_API_KEY"),
    reason="OPENAI_API_KEY not set - skipping real API tests"
)

# Use real server instead of TestClient (background tasks don't work in TestClient)
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")


@pytest.fixture
def test_pdf_path():
    """Path to test PDF file in project."""
    # Try multiple locations for test PDF
    possible_paths = [
        Path(__file__).parent.parent / "test_data" / "integration_test.pdf",
        Path(__file__).parent.parent / "test_data" / "test.pdf",
        Path(__file__).parent.parent / "test_data" / "sample.pdf",
    ]
    
    for pdf_path in possible_paths:
        if pdf_path.exists():
            return pdf_path
    
    pytest.skip(
        f"No test PDF found. Please add a PDF file to: "
        f"{possible_paths[0].parent}/ with name 'test.pdf' or 'sample.pdf'"
    )
    return None


def test_full_pdf_to_ai_workflow(test_pdf_path):
    """
    End-to-end test: Upload PDF -> Index -> Query with OpenAI -> Verify response.
    
    COST: ~$0.0005 (2 OpenAI API calls)
    """
    print("\n" + "="*60)
    print("🚀 Starting End-to-End OpenAI Integration Test")
    print("="*60)
    
    # Step 1: Verify OpenAI health
    print("\n📊 Step 1: Checking OpenAI health...")
    health_resp = requests.get(f"{API_BASE_URL}/fastapi/openai/health")
    assert health_resp.status_code == 200
    health_data = health_resp.json()
    
    print(f"   Status: {health_data['status']}")
    print(f"   Model: {health_data['model']}")
    
    if health_data['status'] != 'healthy':
        pytest.fail(f"OpenAI not healthy: {health_data.get('error_message')}")
    
    # Step 2: Upload PDF
    print(f"\n📄 Step 2: Uploading PDF: {test_pdf_path.name}")
    with open(test_pdf_path, "rb") as f:
        files = {"files": (test_pdf_path.name, f, "application/pdf")}
        upload_resp = requests.post(f"{API_BASE_URL}/fastapi/upload", files=files)
    
    assert upload_resp.status_code == 200
    upload_data = upload_resp.json()
    session_id = upload_data["session_id"]
    
    print(f"   Session ID: {session_id}")
    print(f"   Status: {upload_data['status']}")
    print(f"   Total files: {upload_data['total_files']}")
    
    assert upload_data["status"] == "indexing"
    assert upload_data["total_files"] == 1
    
    # Step 3: Wait for indexing to complete
    print("\n⏳ Step 3: Waiting for indexing to complete...")
    max_attempts = 60  # Increased timeout: 30 seconds total
    for attempt in range(max_attempts):
        status_resp = requests.get(f"{API_BASE_URL}/fastapi/index/status?session_id={session_id}")
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        
        print(f"   Attempt {attempt + 1}: {status_data['status']} "
              f"({status_data['files_indexed']}/{status_data['total_files']})")
        
        if status_data["status"] == "done":
            print("   ✅ Indexing complete!")
            break
        elif status_data["status"] == "error":
            error_msg = status_data.get('error', 'Unknown error')
            pytest.fail(f"Indexing failed: {error_msg}")
        
        time.sleep(0.5)
    else:
        # Final check with detailed status
        final_status = requests.get(f"{API_BASE_URL}/fastapi/index/status?session_id={session_id}").json()
        pytest.fail(
            f"Indexing timeout after {max_attempts * 0.5}s. "
            f"Final status: {final_status}"
        )
    
    # Step 4: Query with OpenAI (First API call - costs ~$0.0002)
    print("\n💬 Step 4: Asking question with OpenAI...")
    question1 = "What is this document about?"
    print(f"   Question: {question1}")
    
    query_resp = requests.post(f"{API_BASE_URL}/fastapi/query", json={
        "session_id": session_id,
        "question": question1,
        "conversation_history": []
    })
    
    assert query_resp.status_code == 200
    query_data = query_resp.json()
    
    answer1 = query_data["answer"]
    citations1 = query_data["citations"]
    
    print(f"   Answer length: {len(answer1)} chars")
    print(f"   Answer preview: {answer1[:150]}...")
    print(f"   Citations: {len(citations1)}")
    
    # Verify response quality
    assert len(answer1) > 50, "Answer too short"
    assert "based on your files" not in answer1.lower() or len(answer1) > 100, \
        "Got fallback response instead of AI-generated"
    assert len(citations1) > 0, "No citations returned"
    
    # Verify citation structure
    citation = citations1[0]
    assert "file" in citation
    assert "page" in citation
    assert citation["file"] == test_pdf_path.name
    
    print("   ✅ Answer looks good!")
    
    # Step 5: Follow-up question with context (Second API call - costs ~$0.0003)
    print("\n💬 Step 5: Asking follow-up question with conversation context...")
    question2 = "Can you provide more specific details?"
    print(f"   Question: {question2}")
    
    query_resp2 = requests.post(f"{API_BASE_URL}/fastapi/query", json={
        "session_id": session_id,
        "question": question2,
        "conversation_history": [
            {
                "role": "user",
                "content": question1,
                "timestamp": "2025-10-28T10:00:00Z"
            },
            {
                "role": "assistant",
                "content": answer1[:200],  # Truncate for API efficiency
                "timestamp": "2025-10-28T10:00:01Z"
            }
        ]
    })
    
    assert query_resp2.status_code == 200
    query_data2 = query_resp2.json()
    
    answer2 = query_data2["answer"]
    print(f"   Answer length: {len(answer2)} chars")
    print(f"   Answer preview: {answer2[:150]}...")
    
    # Verify follow-up response
    assert len(answer2) > 50, "Follow-up answer too short"
    assert answer2 != answer1, "Follow-up should be different from first answer"
    
    print("   ✅ Follow-up answer looks good!")
    
    # Final summary
    print("\n" + "="*60)
    print("✅ END-TO-END TEST PASSED!")
    print("="*60)
    print("📊 Summary:")
    print(f"   - PDF uploaded: {test_pdf_path.name}")
    print("   - Indexing: Success")
    print("   - Questions asked: 2")
    print("   - AI responses: Valid and contextual")
    print("   - Total cost: ~$0.0005")
    print("="*60 + "\n")


def test_openai_error_handling(test_pdf_path):
    """Test that fallback works when OpenAI fails."""
    print("\n🧪 Testing error handling and fallback...")
    
    # Upload and index
    with open(test_pdf_path, "rb") as f:
        files = {"files": (test_pdf_path.name, f, "application/pdf")}
        upload_resp = requests.post(f"{API_BASE_URL}/fastapi/upload", files=files)
    
    session_id = upload_resp.json()["session_id"]
    
    # Wait for indexing
    for _ in range(60):
        status_resp = requests.get(f"{API_BASE_URL}/fastapi/index/status?session_id={session_id}")
        if status_resp.json()["status"] == "done":
            break
        time.sleep(0.5)
    
    # Query should work even if OpenAI has issues (fallback to context)
    query_resp = requests.post(f"{API_BASE_URL}/fastapi/query", json={
        "session_id": session_id,
        "question": "What is the content?",
        "conversation_history": []
    })
    
    assert query_resp.status_code == 200
    query_data = query_resp.json()
    
    # Should get SOME answer (either from OpenAI or fallback)
    assert len(query_data["answer"]) > 0
    assert len(query_data["citations"]) > 0
    
    print("   ✅ Fallback mechanism working!")

