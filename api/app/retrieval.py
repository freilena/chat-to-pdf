"""Retrieval functionality: chunking, embeddings, FAISS, simple keyword search."""
from __future__ import annotations

from typing import Any, TypedDict

import numpy as np
import faiss  # type: ignore[import-untyped]
import tiktoken
from sentence_transformers import SentenceTransformer

# Global embedder instance (lazy-loaded)
_embedder = None


class ScoredDocument(TypedDict):
    """TypedDict for scored document results."""
    score: float
    metadata: dict[str, str]


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

    chunks: list[dict[str, str | int]] = []
    overlap_tokens = int(max_tokens * overlap_pct)
    start = 0

    while start < len(tokens):
        end = min(start + max_tokens, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_content = enc.decode(chunk_tokens)

        chunks.append({
            "text": chunk_content,
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
    Get or initialize the embedding model (all-MiniLM-L6-v2).

    Returns:
        SentenceTransformer model instance
    """
    global _embedder
    if _embedder is None:
        # Use all-MiniLM-L6-v2 (lightweight, 80MB model with 384-dim embeddings)
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
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
            dimension: Dimension of embedding vectors (384 for all-MiniLM-L6-v2)
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
        self.index.add(vec_array)  # pylint: disable=no-value-for-parameter
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


class KeywordIndex:
    """Simple keyword search index using Python built-ins (MVP implementation)."""

    def __init__(self):
        """Initialize simple keyword index."""
        self.documents: list[dict[str, Any]] = []

    def add(self, text: str, metadata: dict[str, Any]) -> None:
        """
        Add a document to the keyword index.

        Args:
            text: Text content to index
            metadata: Associated metadata
        """
        # Store full metadata including text for retrieval
        full_metadata = {**metadata, "text": text}
        self.documents.append(full_metadata)

    def search(self, query: str, k: int = 5) -> list[ScoredDocument]:
        """
        Search for documents matching the query using simple keyword matching.

        Args:
            query: Search query string
            k: Number of results to return

        Returns:
            List of dicts with 'score' and 'metadata' keys
        """
        if not self.documents:
            return []

        query_terms = query.lower().split()
        if not query_terms:
            return []

        # Simple scoring: count how many query terms appear in each document
        scored_docs: list[ScoredDocument] = []
        for doc in self.documents:
            text_lower = doc["text"].lower()
            score = 0
            for term in query_terms:
                if term in text_lower:
                    score += 1

            if score > 0:
                scored_docs.append({
                    "score": float(score),
                    "metadata": doc
                })

        # Sort by score (descending) and return top k
        scored_docs.sort(key=lambda x: float(x["score"]), reverse=True)
        return scored_docs[:k]


class HybridRetriever:
    """Hybrid retrieval system combining semantic and keyword search."""

    def __init__(self):
        """Initialize hybrid retriever with both indexes."""
        self.vector_index = VectorIndex()
        self.keyword_index = KeywordIndex()

    def add_document(self, text: str, metadata: dict[str, Any]) -> None:
        """
        Add a document to both semantic and keyword indexes.

        Args:
            text: Text content to index
            metadata: Associated metadata
        """
        # Ensure text is included in metadata for both indexes
        full_metadata = {**metadata, "text": text}

        # Add to semantic index
        embeddings = embed_texts([text])
        if embeddings:
            self.vector_index.add(embeddings[0], full_metadata)

        # Add to keyword index
        self.keyword_index.add(text, full_metadata)

    def search(self, query: str, k: int = 5) -> list[dict[str, Any]]:
        """
        Search using hybrid approach: combine semantic and keyword results.

        Args:
            query: Search query string
            k: Number of results to return

        Returns:
            List of dicts with 'score' and 'metadata' keys, deduplicated and ranked
        """
        if self.vector_index.size() == 0 and len(self.keyword_index.documents) == 0:
            return []

        # Get semantic search results
        semantic_results = []
        if self.vector_index.size() > 0:
            query_embedding = embed_texts([query])
            if query_embedding:
                semantic_results = self.vector_index.search(query_embedding[0], k)

        # Get keyword search results
        keyword_results = self.keyword_index.search(query, k)

        # Combine and deduplicate results
        combined_results = self._combine_results(semantic_results, keyword_results, k)

        return combined_results

    def _combine_results(
        self,
        semantic_results: list[dict[str, Any]],
        keyword_results: list[dict[str, Any]],
        k: int
    ) -> list[dict[str, Any]]:
        """
        Combine semantic and keyword results, deduplicating by doc_id + chunk_id.

        Args:
            semantic_results: Results from semantic search
            keyword_results: Results from keyword search
            k: Number of results to return

        Returns:
            Combined, deduplicated results ranked by combined score
        """
        # Create a map to track unique documents
        doc_map: dict[tuple[str, int], dict[str, Any]] = {}

        # Add semantic results (weighted higher for semantic relevance)
        for result in semantic_results:
            metadata = result["metadata"]
            doc_key = (metadata["doc_id"], metadata["chunk_id"])
            # Convert L2 distance to similarity score (lower distance = higher similarity)
            semantic_score = 1.0 / (1.0 + result["score"])  # Convert distance to similarity
            doc_map[doc_key] = {
                "score": semantic_score * 0.7,  # 70% weight for semantic
                "metadata": metadata,
                "semantic_score": semantic_score,
                "keyword_score": 0.0
            }

        # Add keyword results, combining with existing semantic scores
        for result in keyword_results:
            metadata = result["metadata"]
            doc_key = (metadata["doc_id"], metadata["chunk_id"])
            keyword_score = result["score"]

            if doc_key in doc_map:
                # Document already exists, combine scores
                doc_map[doc_key]["keyword_score"] = keyword_score
                doc_map[doc_key]["score"] = (
                    doc_map[doc_key]["semantic_score"] * 0.7 +
                    keyword_score * 0.3  # 30% weight for keyword
                )
            else:
                # New document from keyword search only
                doc_map[doc_key] = {
                    "score": keyword_score * 0.3,  # 30% weight for keyword-only
                    "metadata": metadata,
                    "semantic_score": 0.0,
                    "keyword_score": keyword_score
                }

        # Convert to list and sort by combined score
        combined = list(doc_map.values())
        combined.sort(key=lambda x: x["score"], reverse=True)

        return combined[:k]

