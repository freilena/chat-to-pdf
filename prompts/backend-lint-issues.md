Run ruff check .
app/retrieval.py:4:8: F401 [*] `json` imported but unused
  |
2 | from __future__ import annotations
3 | 
4 | import json
  |        ^^^^ F401
5 | import tempfile
6 | import numpy as np
  |
  = help: Remove unused import: `json`

app/retrieval.py:5:8: F401 [*] `tempfile` imported but unused
  |
4 | import json
5 | import tempfile
  |        ^^^^^^^^ F401
6 | import numpy as np
7 | import faiss
  |
  = help: Remove unused import: `tempfile`

tests/test_chunking.py:2:8: F401 [*] `pytest` imported but unused
  |
1 | """Tests for text chunking functionality."""
2 | import pytest
  |        ^^^^^^ F401
3 | from app.retrieval import chunk_text
  |
  = help: Remove unused import: `pytest`

tests/test_embeddings.py:2:8: F401 [*] `pytest` imported but unused
  |
1 | """Tests for embedding generation functionality."""
2 | import pytest
  |        ^^^^^^ F401
3 | from app.retrieval import get_embedder, embed_texts
  |
  = help: Remove unused import: `pytest`

tests/test_hybrid_fusion.py:2:8: F401 [*] `pytest` imported but unused
  |
1 | """Tests for hybrid fusion of semantic and keyword search results."""
2 | import pytest
  |        ^^^^^^ F401
3 | from app.retrieval import HybridRetriever, VectorIndex, KeywordIndex, embed_texts
  |
  = help: Remove unused import: `pytest`

tests/test_hybrid_fusion.py:3:71: F401 [*] `app.retrieval.embed_texts` imported but unused
  |
1 | """Tests for hybrid fusion of semantic and keyword search results."""
2 | import pytest
3 | from app.retrieval import HybridRetriever, VectorIndex, KeywordIndex, embed_texts
  |                                                                       ^^^^^^^^^^^ F401
  |
  = help: Remove unused import: `app.retrieval.embed_texts`

tests/test_keyword_index.py:2:8: F401 [*] `pytest` imported but unused
  |
1 | """Tests for simple keyword search functionality (MVP implementation)."""
2 | import pytest
  |        ^^^^^^ F401
3 | from app.retrieval import KeywordIndex
  |
  = help: Remove unused import: `pytest`

tests/test_query.py:1:8: F401 [*] `io` imported but unused
  |
1 | import io
  |        ^^ F401
2 | from fastapi.testclient import TestClient
3 | from app.main import app, SESSION_STATUS, SESSION_RETRIEVERS
  |
  = help: Remove unused import: `io`

tests/test_upload.py:98:21: F541 [*] f-string without any placeholders
    |
 96 |     up = client.post("/fastapi/upload", files=files)
 97 |     session_id = up.json()["session_id"]
 98 |     st = client.get(f"/fastapi/index/status", params={"session_id": session_id})
    |                     ^^^^^^^^^^^^^^^^^^^^^^^^ F541
 99 |     assert st.status_code == 200, st.text
100 |     sdata = st.json()
    |
    = help: Remove extraneous `f` prefix

tests/test_vector_index.py:2:8: F401 [*] `pytest` imported but unused
  |
1 | """Tests for FAISS vector index functionality."""
2 | import pytest
  |        ^^^^^^ F401
3 | from app.retrieval import VectorIndex, embed_texts
  |
  = help: Remove unused import: `pytest`

Found 10 errors.
[*] 10 fixable with the `--fix` option.
