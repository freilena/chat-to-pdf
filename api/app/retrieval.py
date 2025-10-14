"""Retrieval functionality: chunking, embeddings, FAISS, Tantivy."""
from __future__ import annotations

import tiktoken


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

