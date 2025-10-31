# Chat to your PDF

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
- **Chat Interface**: Complete responsive chat UI with message components and auto-scroll
- **AI Answer Generation**: OpenAI GPT-4o-mini integration with RAG (Retrieval-Augmented Generation)
- **Query Integration**: Context-aware responses using conversation history and document retrieval

### Planned
- **PDF Viewer**: Modal viewer with sentence-level highlighting
- **Citations**: Include citations from the document
- **Multiple documents**: User can upload several documents
- **Backend State Management**: Migrate from In-Memory Session Storage to Database
- **Session Management**: Inactivity Tracking, Session Expiry
- **File inventory Management**: Delete files, upload additional files
- **Rate Limiting Implementation**: Implement rate limiting across all API endpoints
- **Monitoring and Alerts**: Set up thresholds and alerts
- **Error Handeling**: Standardize error handling across all endpoints
- **Security**: Improve security based on Audit findings
- **Integration Testing Suite**: Create comprehensive automated integration tests
- **Performance Testing & Optimization**

## Architecture

- **Frontend**: Next.js (React) with TypeScript
- **Backend**: FastAPI (Python) with hybrid retrieval system and CORS support
- **LLM**: OpenAI GPT-4o-mini for answer generation with RAG
- **Vector Store**: FAISS for semantic search (CPU-optimized)
- **Keyword Search**: Simple keyword matching (MVP - Tantivy planned for future)
- **Embeddings**: sentence-transformers with all-MiniLM-L6-v2 (80MB, 2x faster)
- **Deployment**: Docker Compose with optimized layer caching

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- OpenAI API key (required for AI features)

### Development Setup

1. **Clone and navigate to the project**:
   ```bash
   cd code/pdf-chat
   ```

2. **Configure OpenAI API key**:
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

3. **Start the services**:
   ```bash
   docker compose up -d
   ```

4. **Access the application**:
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
- `POST /fastapi/query` - Ask questions about uploaded documents (with OpenAI)
- `GET /fastapi/openai/health` - Check OpenAI API health and availability
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

**Test Coverage**: 100+ tests covering:
- PDF upload and validation
- Text chunking and embeddings
- Vector and keyword indexing
- Hybrid search and fusion
- API endpoints and error handling
- Version tracking endpoints
- Version badge component behavior
- Chat interface and message components
- Responsive design and accessibility
- OpenAI client functionality
- OpenAI health endpoint
- Error handling for auth, rate limits, and network issues

## Continuous Integration

The project uses GitHub Actions for automated CI/CD with comprehensive quality checks:

### CI Pipeline Features
- **Automated Testing**: Runs on every commit and pull request
- **Parallel Execution**: All 6 jobs run simultaneously (~3-4 minutes total)
- **Dependency Caching**: Pip and npm dependencies cached for speed
- **Model Caching**: Embedding model cached to avoid re-downloads

### CI Jobs
1. **Backend Linting** - Ruff code style and quality checks
2. **Backend Type Checking** - MyPy static type analysis
3. **Backend Tests** - Pytest test suite (50+ tests)
4. **Frontend Linting** - ESLint code quality checks
5. **Frontend Type Checking** - TypeScript compilation validation
6. **Frontend Tests** - Vitest test suite (81 tests)

### Additional Workflows
- **Pylint Analysis** - Python code analysis with detailed reports
- **Trigger Events**: Push to any branch, pull requests, and main branch merges

### CI Status
- **Required for Merge**: No (informational only - can merge even if checks fail)
- **Notifications**: GitHub UI only
- **Runtime**: 3-4 minutes (first run ~5 minutes for cache warming)

For detailed CI documentation, see [docs/ci-documentation.md](docs/ci-documentation.md).

## Project Structure

```
code/pdf-chat/
├── .github/               # GitHub Actions CI/CD
│   └── workflows/
│       ├── ci.yml         # Main CI pipeline (6 parallel jobs)
│       └── pylint.yml     # Python code analysis
├── api/                   # FastAPI backend
│   ├── app/
│   │   ├── main.py        # API routes, session mgmt, version endpoints
│   │   ├── retrieval.py   # Hybrid search implementation
│   │   └── openai_client.py  # OpenAI API wrapper
│   ├── tests/             # Comprehensive test suite (10+ test files)
│   └── requirements.txt   # Python dependencies (optimized)
├── web/                   # Next.js frontend
│   ├── src/
│   │   ├── app/          # Next.js app router (inc. chat page)
│   │   ├── components/   # React components (VersionBadge, chat components)
│   │   └── hooks/        # Custom React hooks (useSession)
│   └── package.json      # Node.js dependencies
├── VERSION                # Semantic version tracking
├── docker-compose.yml     # Multi-service orchestration (optimized)
├── Dockerfile.api         # Backend container (CPU-only PyTorch)
├── Dockerfile.web         # Frontend container
└── docs/
    ├── specification.md     # Detailed technical specification
    ├── ci-documentation.md  # CI/CD documentation
    ├── chat-page-layout.md  # Chat UI implementation docs
    ├── component-api.md     # Component API reference
    ├── developer-guide.md   # Developer guide for chat components
    └── api-reference.md     # API reference for chat endpoints
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

### OpenAI Configuration
- Model: gpt-4o-mini (cost-effective, high-quality responses)
- Max tokens per response: 250 (~150-200 words)
- Context window: Last 4 conversation messages
- Temperature: 0.7 (balanced creativity/consistency)
- Health check caching: 30 seconds

## Contributing

This project follows TDD practices with comprehensive test coverage. All changes should include appropriate tests and maintain the existing test suite.

## License

Private project - All rights reserved.
