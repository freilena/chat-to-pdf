"""Tests for simple keyword search functionality (MVP implementation)."""
import pytest
from app.retrieval import KeywordIndex


def test_keyword_index_creation():
    index = KeywordIndex()
    assert index is not None


def test_keyword_index_add_and_search():
    index = KeywordIndex()
    
    # Add some documents
    docs = [
        {"text": "Python is a high-level programming language", "doc_id": "doc1", "chunk_id": 0},
        {"text": "Machine learning involves training models on data", "doc_id": "doc2", "chunk_id": 0},
        {"text": "Python libraries like NumPy and Pandas are popular", "doc_id": "doc3", "chunk_id": 0},
        {"text": "The weather forecast predicts rain tomorrow", "doc_id": "doc4", "chunk_id": 0}
    ]
    
    for doc in docs:
        index.add(text=doc["text"], metadata={"doc_id": doc["doc_id"], "chunk_id": doc["chunk_id"]})
    
    # Search for "Python"
    results = index.search("Python programming", k=2)
    
    assert len(results) == 2
    # Each result should have score and metadata
    for result in results:
        assert "score" in result
        assert "metadata" in result
        assert "text" in result["metadata"]
    
    # Results should contain Python-related documents
    result_texts = [r["metadata"]["text"] for r in results]
    assert any("Python" in text for text in result_texts)


def test_keyword_index_bm25_ranking():
    index = KeywordIndex()
    
    # Add documents with varying term frequencies
    docs = [
        {"text": "machine learning machine learning machine learning", "doc_id": "doc1"},
        {"text": "machine learning is useful", "doc_id": "doc2"},
        {"text": "deep learning neural networks", "doc_id": "doc3"}
    ]
    
    for doc in docs:
        index.add(text=doc["text"], metadata={"doc_id": doc["doc_id"]})
    
    results = index.search("machine learning", k=3)
    
    # Should return results in relevance order (BM25 scoring)
    assert len(results) > 0
    # Scores should be in descending order
    scores = [r["score"] for r in results]
    assert scores == sorted(scores, reverse=True)


def test_keyword_index_empty_search():
    index = KeywordIndex()
    results = index.search("anything", k=5)
    assert results == []


def test_keyword_index_search_with_k_larger_than_size():
    index = KeywordIndex()
    index.add(text="Single document", metadata={"doc_id": "doc1"})
    
    results = index.search("document", k=10)
    assert len(results) == 1


def test_keyword_index_no_matches():
    index = KeywordIndex()
    index.add(text="Python programming language", metadata={"doc_id": "doc1"})
    
    # Search for completely unrelated term
    results = index.search("zzzzqqqq", k=5)
    assert results == []

