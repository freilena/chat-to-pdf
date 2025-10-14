"""Tests for hybrid fusion of semantic and keyword search results."""
import pytest
from app.retrieval import HybridRetriever, VectorIndex, KeywordIndex, embed_texts


def test_hybrid_retriever_creation():
    retriever = HybridRetriever()
    assert retriever is not None
    assert isinstance(retriever.vector_index, VectorIndex)
    assert isinstance(retriever.keyword_index, KeywordIndex)


def test_hybrid_retriever_add_document():
    retriever = HybridRetriever()
    
    text = "Python is a programming language used for data science."
    metadata = {"doc_id": "doc1", "chunk_id": 0}
    
    retriever.add_document(text, metadata)
    
    # Should be added to both indexes
    assert retriever.vector_index.size() == 1
    assert len(retriever.keyword_index.documents) == 1


def test_hybrid_retriever_search_combines_results():
    retriever = HybridRetriever()
    
    # Add some test documents
    docs = [
        ("Python is a high-level programming language", {"doc_id": "doc1", "chunk_id": 0}),
        ("Machine learning involves training models on data", {"doc_id": "doc2", "chunk_id": 0}),
        ("Python libraries like NumPy and Pandas are popular", {"doc_id": "doc3", "chunk_id": 0}),
        ("The weather forecast predicts rain tomorrow", {"doc_id": "doc4", "chunk_id": 0})
    ]
    
    for text, metadata in docs:
        retriever.add_document(text, metadata)
    
    # Search should return results from both semantic and keyword search
    results = retriever.search("Python programming", k=3)
    
    assert len(results) > 0
    # Each result should have score and metadata
    for result in results:
        assert "score" in result
        assert "metadata" in result
        assert "text" in result["metadata"]


def test_hybrid_retriever_deduplicates_results():
    retriever = HybridRetriever()
    
    # Add a document that will match both semantic and keyword search
    text = "Python programming language for data science"
    metadata = {"doc_id": "doc1", "chunk_id": 0}
    retriever.add_document(text, metadata)
    
    results = retriever.search("Python", k=5)
    
    # Should not have duplicate results (same doc_id + chunk_id)
    doc_chunk_ids = [(r["metadata"]["doc_id"], r["metadata"]["chunk_id"]) for r in results]
    assert len(doc_chunk_ids) == len(set(doc_chunk_ids))


def test_hybrid_retriever_empty_search():
    retriever = HybridRetriever()
    results = retriever.search("anything", k=5)
    assert results == []


def test_hybrid_retriever_ranks_by_combined_score():
    retriever = HybridRetriever()
    
    # Add documents with different relevance
    docs = [
        ("Python programming language", {"doc_id": "doc1", "chunk_id": 0}),  # High relevance
        ("Machine learning with Python", {"doc_id": "doc2", "chunk_id": 0}),  # Medium relevance  
        ("Weather forecast", {"doc_id": "doc3", "chunk_id": 0})  # Low relevance
    ]
    
    for text, metadata in docs:
        retriever.add_document(text, metadata)
    
    results = retriever.search("Python programming", k=3)
    
    # Results should be ranked by combined score
    assert len(results) > 0
    scores = [r["score"] for r in results]
    assert scores == sorted(scores, reverse=True)
    
    # Most relevant should be first
    assert "Python programming language" in results[0]["metadata"]["text"]
