"""Tests for text chunking functionality."""
from app.retrieval import chunk_text


def test_chunk_text_returns_list_of_chunks():
    text = "This is a test document. " * 100  # ~500 tokens
    chunks = chunk_text(text)
    assert isinstance(chunks, list)
    assert len(chunks) > 0
    for chunk in chunks:
        assert isinstance(chunk, dict)
        assert "text" in chunk
        assert "token_count" in chunk


def test_chunk_respects_token_limits():
    # Create text that's definitely too long for one chunk
    text = "Word " * 1000  # ~1000 tokens
    chunks = chunk_text(text)
    # Each chunk should be around 400-600 tokens
    for chunk in chunks:
        assert 100 <= chunk["token_count"] <= 700  # Allow some flexibility


def test_chunk_includes_overlap():
    # Test that consecutive chunks have overlapping content
    text = "Sentence one. Sentence two. Sentence three. " * 50
    chunks = chunk_text(text, max_tokens=100, overlap_pct=0.15)
    
    if len(chunks) > 1:
        # Check that there's some overlap between consecutive chunks
        for i in range(len(chunks) - 1):
            chunk1_text = chunks[i]["text"]
            chunk2_text = chunks[i + 1]["text"]
            # Last words of chunk1 should appear in first part of chunk2
            chunk1_words = chunk1_text.split()[-10:]
            chunk2_start = " ".join(chunk2_text.split()[:20])
            # At least some words should overlap
            overlap_found = any(word in chunk2_start for word in chunk1_words)
            assert overlap_found, "Expected overlap between consecutive chunks"


def test_empty_text_returns_empty_list():
    chunks = chunk_text("")
    assert chunks == []


def test_single_sentence_returns_single_chunk():
    text = "This is a single short sentence."
    chunks = chunk_text(text)
    assert len(chunks) == 1
    assert chunks[0]["text"] == text

