# Chat-To-PDF

A browser-based web application that enables users to chat with their PDF documents using AI-powered retrieval and question answering.

## Features

### Implemented
- **PDF Upload & Validation**: Drag-drop interface with file size limits (50MB per file, 100MB total)
- **Text Extraction**: Automatic PDF text layer extraction with scanned PDF detection
- **Hybrid Search**: Combines vector similarity (FAISS) and keyword search for optimal retrieval
- **Session Management**: Per-session data storage with automatic cleanup
- **RESTful API**: FastAPI backend with CORS support and comprehensive error handling
- **Version Tracking**: Git-integrated version system with API endpoints and UI badge
- **Optimized Build**: CPU-only PyTorch and lightweight embeddings (build time: ~15-20 min vs ~1 hour)

### Planned
- **Chat Interface**: Interactive Q&A with inline citations
- **PDF Viewer**: Modal viewer with sentence-level highlighting
- **AI Answer Generation**: Llama 3.1 8B integration via Ollama

## Architecture

- **Frontend**: Next.js (React) with TypeScript
- **Backend**: FastAPI (Python) with hybrid retrieval system and CORS support
- **Vector Store**: FAISS for semantic search (CPU-optimized)
- **Keyword Search**: Simple keyword matching (MVP - Tantivy planned for future)
- **Embeddings**: sentence-transformers with all-MiniLM-L6-v2 (80MB, 2x faster)
- **PyTorch**: CPU-only build (~184MB vs 900MB GPU version)
- **Deployment**: Docker Compose with optimized layer caching

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Development Setup

1. **Clone and navigate to the project**:
   ```bash
   cd code/pdf-chat
   ```

2. **Start the services**:
   ```bash
   docker compose up -d
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Local Development

1. **Backend (Python/FastAPI)**:
   ```bash
   cd api
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend (Next.js)**:
   ```bash
   cd web
   npm install
   npm run dev
   ```

## API Endpoints

- `POST /fastapi/upload` - Upload PDF files
- `GET /fastapi/index/status` - Check indexing progress
- `POST /fastapi/query` - Ask questions about uploaded documents
- `GET /healthz` - Health check (includes version)
- `GET /version` - Version info (version, git branch, commit, date, environment)

## Testing

Run the comprehensive test suite:

**Backend Tests** (via Docker):
```bash
docker compose exec api pytest -v
```

**Frontend Tests** (via Docker):
```bash
docker compose exec web npm run test
```

**Test Coverage**: 42+ tests covering:
- PDF upload and validation
- Text chunking and embeddings
- Vector and keyword indexing
- Hybrid search and fusion
- API endpoints and error handling
- Version tracking endpoints
- Version badge component behavior

## Project Structure

```
code/pdf-chat/
├── api/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py        # API routes, session mgmt, version endpoints
│   │   └── retrieval.py   # Hybrid search implementation
│   ├── tests/             # Comprehensive test suite (8+ test files)
│   └── requirements.txt   # Python dependencies (optimized)
├── web/                   # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   └── components/   # React components (inc. VersionBadge)
│   └── package.json      # Node.js dependencies
├── VERSION                # Semantic version tracking
├── docker-compose.yml     # Multi-service orchestration (optimized)
├── Dockerfile.api         # Backend container (CPU-only PyTorch)
├── Dockerfile.web         # Frontend container
└── docs/
    └── specification.md  # Detailed technical specification
```

## Configuration

### File Limits
- Maximum file size: 50MB per PDF
- Maximum total upload: 100MB per session
- Maximum pages per PDF: 500
- Maximum files per session: 10

### Search Configuration
- Chunk size: 400-600 tokens with 15% overlap
- Vector search: Top 20 results
- Keyword search: Top 20 results
- Final results: Top 8 after fusion

## Contributing

This project follows TDD practices with comprehensive test coverage. All changes should include appropriate tests and maintain the existing test suite.

## License

Private project - All rights reserved.
