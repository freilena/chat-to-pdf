# Chat-To-PDF

A browser-based web application that enables users to chat with their PDF documents using AI-powered retrieval and question answering.

## Features

### Implemented
- **PDF Upload & Validation**: Drag-drop interface with file size limits (50MB per file, 100MB total)
- **Text Extraction**: Automatic PDF text layer extraction with scanned PDF detection
- **Hybrid Search**: Combines vector similarity (FAISS) and keyword search (BM25) for optimal retrieval
- **Session Management**: Per-session data storage with automatic cleanup
- **RESTful API**: FastAPI backend with comprehensive error handling

### Planned
- **Chat Interface**: Interactive Q&A with inline citations
- **PDF Viewer**: Modal viewer with sentence-level highlighting
- **AI Answer Generation**: Llama 3.1 8B integration via Ollama

## Architecture

- **Frontend**: Next.js (React) with TypeScript
- **Backend**: FastAPI (Python) with hybrid retrieval system
- **Vector Store**: FAISS for semantic search
- **Keyword Search**: Tantivy for BM25 search
- **Embeddings**: sentence-transformers (bge-small-en)
- **Deployment**: Docker Compose with multi-service setup

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
- `GET /healthz` - Health check

## Testing

Run the comprehensive test suite:

```bash
cd api
pytest tests/ -v
```

**Test Coverage**: 32 tests covering:
- PDF upload and validation
- Text chunking and embeddings
- Vector and keyword indexing
- Hybrid search and fusion
- API endpoints and error handling

## Project Structure

```
code/pdf-chat/
├── api/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py        # API routes and session management
│   │   └── retrieval.py   # Hybrid search implementation
│   ├── tests/             # Comprehensive test suite
│   └── requirements.txt   # Python dependencies
├── web/                   # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js app router
│   │   └── components/   # React components
│   └── package.json      # Node.js dependencies
├── docker-compose.yml     # Multi-service orchestration
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
