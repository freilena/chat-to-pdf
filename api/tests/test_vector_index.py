"""Tests for FAISS vector index functionality."""
from app.retrieval import VectorIndex, embed_texts


def test_vector_index_creation():
    index = VectorIndex(dimension=384)
    assert index is not None
    assert index.size() == 0


def test_vector_index_add_and_search():
    index = VectorIndex(dimension=384)
    
    # Create some test texts and embeddings
    texts = [
        "The quick brown fox jumps over the lazy dog.",
        "Machine learning is a subset of artificial intelligence.",
        "Python is a popular programming language.",
        "The weather today is sunny and warm."
    ]
    
    embeddings = embed_texts(texts)
    
    # Add to index with metadata
    for i, (text, emb) in enumerate(zip(texts, embeddings)):
        index.add(
            vector=emb,
            metadata={"text": text, "doc_id": f"doc{i}", "chunk_id": i}
        )
    
    assert index.size() == 4
    
    # Search for similar to "programming languages"
    query_emb = embed_texts(["programming languages"])[0]
    results = index.search(query_emb, k=2)
    
    assert len(results) == 2
    # Each result should have score and metadata
    for result in results:
        assert "score" in result
        assert "metadata" in result
        assert "text" in result["metadata"]
    
    # The Python text should be most similar
    assert "Python" in results[0]["metadata"]["text"]


def test_vector_index_search_with_k_larger_than_size():
    index = VectorIndex(dimension=384)
    
    texts = ["Short test."]
    embeddings = embed_texts(texts)
    index.add(vector=embeddings[0], metadata={"text": texts[0]})
    
    # Request more results than available
    query_emb = embed_texts(["test"])[0]
    results = index.search(query_emb, k=10)
    
    # Should return only what's available
    assert len(results) == 1


def test_vector_index_empty_search():
    index = VectorIndex(dimension=384)
    query_emb = embed_texts(["anything"])[0]
    results = index.search(query_emb, k=5)
    
    assert results == []

