"""
Tests for query endpoint's OpenAI integration and fallback logic.

These tests verify that the query endpoint correctly:
1. Uses OpenAI for answer generation
2. Falls back to context-based answers when OpenAI fails
3. Handles various OpenAI error scenarios
"""

import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app, SESSION_STATUS, SESSION_RETRIEVERS
from app.retrieval import HybridRetriever

client = TestClient(app)


@pytest.fixture
def setup_test_session():
    """Create a test session with indexed content."""
    session_id = "test-openai-query-session"
    
    # Set up session status
    SESSION_STATUS[session_id] = {
        "status": "done",
        "total_files": 1,
        "files_indexed": 1,
    }
    
    # Create and populate a retriever
    retriever = HybridRetriever()
    retriever.add_document(
        "The company policy states that all employees must submit timesheets by Friday.",
        {"doc_id": "policy.pdf", "chunk_id": 0, "page": 1, "sentenceSpan": (0, 80)}
    )
    retriever.add_document(
        "Vacation requests require 2 weeks advance notice and manager approval.",
        {"doc_id": "policy.pdf", "chunk_id": 1, "page": 2, "sentenceSpan": (0, 70)}
    )
    SESSION_RETRIEVERS[session_id] = retriever
    
    yield session_id
    
    # Cleanup
    if session_id in SESSION_STATUS:
        del SESSION_STATUS[session_id]
    if session_id in SESSION_RETRIEVERS:
        del SESSION_RETRIEVERS[session_id]


def test_query_uses_openai_for_answer(setup_test_session):
    """Test that query endpoint uses OpenAI to generate answers."""
    session_id = setup_test_session
    
    # Mock OpenAI client to return a specific answer
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_client.generate_text.return_value = "According to the policy, timesheets must be submitted by Friday."
        mock_get_client.return_value = mock_client
        
        payload = {
            "session_id": session_id,
            "question": "When should timesheets be submitted?",
            "conversation_history": []
        }
        
        resp = client.post("/fastapi/query", json=payload)
        assert resp.status_code == 200
        
        data = resp.json()
        assert data["answer"] == "According to the policy, timesheets must be submitted by Friday."
        assert len(data["citations"]) > 0
        
        # Verify OpenAI was called
        assert mock_client.generate_text.called


def test_query_includes_conversation_context(setup_test_session):
    """Test that query passes conversation history to OpenAI."""
    session_id = setup_test_session
    
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_client.generate_text.return_value = "Based on our previous discussion, vacation requests need 2 weeks notice."
        mock_get_client.return_value = mock_client
        
        conversation_history = [
            {"role": "user", "content": "What are the timesheet rules?", "timestamp": "2025-10-28T10:00:00Z"},
            {"role": "assistant", "content": "Timesheets must be submitted by Friday.", "timestamp": "2025-10-28T10:00:01Z"}
        ]
        
        payload = {
            "session_id": session_id,
            "question": "What about vacation requests?",
            "conversation_history": conversation_history
        }
        
        resp = client.post("/fastapi/query", json=payload)
        assert resp.status_code == 200
        
        # Verify OpenAI was called with context
        mock_client.generate_text.assert_called_once()
        call_args = mock_client.generate_text.call_args
        
        # Check that conversation context was passed
        assert call_args.kwargs['context'] is not None
        assert len(call_args.kwargs['context']) > 0


def test_query_fallback_when_openai_fails(setup_test_session):
    """Test that query falls back to context when OpenAI fails."""
    session_id = setup_test_session
    
    # Mock OpenAI to raise an exception
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_client.generate_text.side_effect = Exception("OpenAI API error")
        mock_get_client.return_value = mock_client
        
        payload = {
            "session_id": session_id,
            "question": "What is the timesheet policy?",
            "conversation_history": []
        }
        
        resp = client.post("/fastapi/query", json=payload)
        assert resp.status_code == 200
        
        data = resp.json()
        # Should still get an answer (fallback)
        assert "answer" in data
        assert len(data["answer"]) > 0
        assert "Based on your files:" in data["answer"]
        
        # Should still get citations
        assert len(data["citations"]) > 0


def test_query_fallback_on_authentication_error(setup_test_session):
    """Test fallback when OpenAI authentication fails."""
    session_id = setup_test_session
    
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_client.generate_text.side_effect = Exception("OpenAI authentication failed")
        mock_get_client.return_value = mock_client
        
        payload = {
            "session_id": session_id,
            "question": "What is the vacation policy?",
            "conversation_history": []
        }
        
        resp = client.post("/fastapi/query", json=payload)
        assert resp.status_code == 200
        
        data = resp.json()
        # Should use fallback answer
        assert "Based on your files:" in data["answer"]
        assert "Vacation requests" in data["answer"] or "vacation" in data["answer"].lower()


def test_query_fallback_on_rate_limit(setup_test_session):
    """Test fallback when OpenAI rate limit is exceeded."""
    session_id = setup_test_session
    
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_client.generate_text.side_effect = Exception("OpenAI rate limit exceeded")
        mock_get_client.return_value = mock_client
        
        payload = {
            "session_id": session_id,
            "question": "Tell me about the policies",
            "conversation_history": []
        }
        
        resp = client.post("/fastapi/query", json=payload)
        assert resp.status_code == 200
        
        data = resp.json()
        # Should still provide an answer via fallback
        assert len(data["answer"]) > 0
        assert len(data["citations"]) > 0


def test_query_builds_proper_openai_prompt(setup_test_session):
    """Test that the query endpoint builds a proper prompt for OpenAI."""
    session_id = setup_test_session
    
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_client.generate_text.return_value = "Test answer"
        mock_get_client.return_value = mock_client
        
        payload = {
            "session_id": session_id,
            "question": "What are the rules?",
            "conversation_history": []
        }
        
        resp = client.post("/fastapi/query", json=payload)
        assert resp.status_code == 200
        
        # Verify the prompt structure
        call_args = mock_client.generate_text.call_args
        prompt = call_args.kwargs['prompt']
        
        # Prompt should include:
        # 1. System instruction
        assert "helpful assistant" in prompt.lower() or "answer" in prompt.lower()
        
        # 2. Context from documents
        assert "[Source" in prompt or "context" in prompt.lower()
        
        # 3. The user's question
        assert "What are the rules?" in prompt


def test_query_limits_context_to_top_results(setup_test_session):
    """Test that only top search results are used for OpenAI context."""
    session_id = setup_test_session
    
    # Add more documents
    retriever = SESSION_RETRIEVERS[session_id]
    for i in range(10):
        retriever.add_document(
            f"Additional policy document {i} with some content about procedures.",
            {"doc_id": f"doc{i}.pdf", "chunk_id": i, "page": i+1, "sentenceSpan": (0, 50)}
        )
    
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_client.generate_text.return_value = "Answer based on top results"
        mock_get_client.return_value = mock_client
        
        payload = {
            "session_id": session_id,
            "question": "What are the policies?",
            "conversation_history": []
        }
        
        resp = client.post("/fastapi/query", json=payload)
        assert resp.status_code == 200
        
        # Verify OpenAI was called
        call_args = mock_client.generate_text.call_args
        prompt = call_args.kwargs['prompt']
        
        # Should only include top 3 sources (as per implementation)
        assert prompt.count("[Source") <= 3


def test_query_handles_empty_openai_response(setup_test_session):
    """Test handling when OpenAI returns an empty response."""
    session_id = setup_test_session
    
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_client.generate_text.return_value = ""
        mock_get_client.return_value = mock_client
        
        payload = {
            "session_id": session_id,
            "question": "What is the policy?",
            "conversation_history": []
        }
        
        resp = client.post("/fastapi/query", json=payload)
        assert resp.status_code == 200
        
        data = resp.json()
        # Should still have some answer (even if empty from OpenAI, we accept it)
        assert "answer" in data


def test_query_max_tokens_configuration(setup_test_session):
    """Test that max_tokens is properly configured for OpenAI calls."""
    session_id = setup_test_session
    
    with patch('app.main.get_openai_client') as mock_get_client:
        mock_client = AsyncMock()
        mock_client.generate_text.return_value = "Configured answer"
        mock_get_client.return_value = mock_client
        
        payload = {
            "session_id": session_id,
            "question": "Test question",
            "conversation_history": []
        }
        
        resp = client.post("/fastapi/query", json=payload)
        assert resp.status_code == 200
        
        # Verify max_tokens is set (default should be 250)
        call_args = mock_client.generate_text.call_args
        assert call_args.kwargs['max_tokens'] == 250

