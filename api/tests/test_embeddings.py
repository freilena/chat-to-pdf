"""Tests for embedding generation functionality."""
import pytest
from app.retrieval import get_embedder, embed_texts


def test_get_embedder_returns_model():
    embedder = get_embedder()
    assert embedder is not None


def test_embed_texts_returns_vectors():
    texts = ["This is a test sentence.", "Another test sentence."]
    embeddings = embed_texts(texts)
    
    assert len(embeddings) == len(texts)
    # BGE-small-en produces 384-dimensional vectors
    assert len(embeddings[0]) == 384
    assert all(isinstance(val, float) for val in embeddings[0])


def test_embed_texts_handles_empty_list():
    embeddings = embed_texts([])
    assert embeddings == []


def test_embed_texts_produces_different_vectors_for_different_texts():
    texts = ["Computer science", "Cooking recipes"]
    embeddings = embed_texts(texts)
    
    # Vectors should be different for semantically different texts
    assert embeddings[0] != embeddings[1]


def test_embed_texts_produces_similar_vectors_for_similar_texts():
    import numpy as np
    
    texts = ["The cat sat on the mat.", "A cat was sitting on a mat."]
    embeddings = embed_texts(texts)
    
    # Calculate cosine similarity
    vec1 = np.array(embeddings[0])
    vec2 = np.array(embeddings[1])
    cosine_sim = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
    
    # Similar sentences should have high cosine similarity (> 0.7)
    assert cosine_sim > 0.7, f"Expected high similarity, got {cosine_sim}"

