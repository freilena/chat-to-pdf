"""Retrieval functionality: chunking, embeddings, FAISS, Tantivy."""
from __future__ import annotations

import numpy as np
import faiss
import tiktoken
from sentence_transformers import SentenceTransformer
from typing import Any

# Global embedder instance (lazy-loaded)
_embedder = None


def chunk_text(
    text: str,
    max_tokens: int = 500,
    overlap_pct: float = 0.15
) -> list[dict[str, str | int]]:
    """
    Chunk text into paragraph-sized pieces with overlap.
    
    Args:
        text: Input text to chunk
        max_tokens: Maximum tokens per chunk (target ~400-600)
        overlap_pct: Overlap percentage between chunks (default 15%)
    
    Returns:
        List of dicts with 'text' and 'token_count' keys
    """
    if not text or not text.strip():
        return []
    
    # Use cl100k_base encoding (GPT-4/GPT-3.5 tokenizer)
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)
    
    if len(tokens) <= max_tokens:
        return [{"text": text, "token_count": len(tokens)}]
    
    chunks = []
    overlap_tokens = int(max_tokens * overlap_pct)
    start = 0
    
    while start < len(tokens):
        end = min(start + max_tokens, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text = enc.decode(chunk_tokens)
        
        chunks.append({
            "text": chunk_text,
            "token_count": len(chunk_tokens)
        })
        
        # Move start forward, accounting for overlap
        if end < len(tokens):
            start = end - overlap_tokens
        else:
            break
    
    return chunks


def get_embedder() -> SentenceTransformer:
    """
    Get or initialize the embedding model (bge-small-en).
    
    Returns:
        SentenceTransformer model instance
    """
    global _embedder
    if _embedder is None:
        # Use BGE-small-en as specified in the spec
        _embedder = SentenceTransformer("BAAI/bge-small-en-v1.5")
    return _embedder


def embed_texts(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of texts.
    
    Args:
        texts: List of text strings to embed
    
    Returns:
        List of embedding vectors (each vector is a list of floats)
    """
    if not texts:
        return []
    
    embedder = get_embedder()
    embeddings = embedder.encode(texts, convert_to_numpy=True)
    
    # Convert numpy arrays to lists for JSON serialization
    return [emb.tolist() for emb in embeddings]


class VectorIndex:
    """FAISS-based vector index for semantic search."""
    
    def __init__(self, dimension: int = 384):
        """
        Initialize FAISS index.
        
        Args:
            dimension: Dimension of embedding vectors (384 for bge-small-en)
        """
        self.dimension = dimension
        # Use L2 distance (can also use Inner Product for cosine similarity)
        self.index = faiss.IndexFlatL2(dimension)
        self.metadata: list[dict[str, Any]] = []
    
    def add(self, vector: list[float], metadata: dict[str, Any]) -> None:
        """
        Add a vector to the index with associated metadata.
        
        Args:
            vector: Embedding vector
            metadata: Associated metadata (text, doc_id, chunk_id, etc.)
        """
        vec_array = np.array([vector], dtype=np.float32)
        self.index.add(vec_array)
        self.metadata.append(metadata)
    
    def search(self, query_vector: list[float], k: int = 5) -> list[dict[str, Any]]:
        """
        Search for k nearest neighbors.
        
        Args:
            query_vector: Query embedding vector
            k: Number of results to return
        
        Returns:
            List of dicts with 'score' and 'metadata' keys
        """
        if self.size() == 0:
            return []
        
        # Adjust k if larger than index size
        k = min(k, self.size())
        
        query_array = np.array([query_vector], dtype=np.float32)
        distances, indices = self.index.search(query_array, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1:  # Valid index
                results.append({
                    "score": float(dist),
                    "metadata": self.metadata[idx]
                })
        
        return results
    
    def size(self) -> int:
        """Return the number of vectors in the index."""
        return self.index.ntotal

