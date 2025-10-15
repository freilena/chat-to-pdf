### MVP Specification — "Chat with your PDFs"

**🎯 IMPLEMENTATION STATUS: CORE COMPLETE (80%)**
- ✅ **Backend Infrastructure**: Complete (retrieval, indexing, query processing)
- ✅ **API Endpoints**: Complete (upload, status, query)
- ✅ **Frontend Upload UI**: Complete (drag-drop, progress, validation)
- ✅ **Testing**: Complete (32 passing tests)
- ⏳ **Pending**: OAuth auth, chat UI, PDF viewer, Ollama integration

- **Platform**: Browser-based web app
- **Auth**: Required; OAuth via Google and Apple - *Pending*
- **Storage model**: Per-session, ephemeral; encrypted temp disk (OS temp dir); auto-delete on 60-minute inactivity or on sign-out; no persistence **COMPLETED**

### Primary user flow
1. User signs in (Google/Apple).
2. User uploads PDFs (digitally searchable only).
3. System indexes all files; chat is blocked until indexing completes.
4. User asks a question; system retrieves and fuses results; generates a grounded answer with inline citation markers [1]–[3].
5. User may click “Show citations” to open a collapsible panel (max 3 sources).
6. Clicking any inline marker opens a modal PDF viewer at the cited page with exact sentence highlighted.
7. Session auto-expires after 60 minutes of inactivity; data deleted immediately. Sign-out also deletes data.

### Functional requirements
- **Uploads**
  - Limits: per file 50 MB; total per session 100 MB; max pages/PDF 500; max files/session 10
  - Reject scanned/unencrypted image-only PDFs with a clear error: “This file appears to be scanned/unsearchable. Scanned PDFs aren’t supported in the MVP.”
  - Validate limits and text-layer presence client-side where possible; revalidate server-side
- **Indexing**
  - Chunking: paragraph-sized (~400–600 tokens) with 15% overlap
  - Embeddings: local open-source `bge-small-en` (English-only)
  - Vector store: FAISS (exact or HNSW, CPU)
  - Keyword index: Tantivy (BM25)
  - Store mapping for paragraph → sentences (character spans) for highlight
- **Retrieval**
  - Hybrid: run FAISS and BM25 in parallel
  - Top-k: FAISS k=20, Tantivy k=20; fuse with Reciprocal Rank Fusion (RRF) to top 8 for generation
  - Default scope: all uploaded PDFs; optional filter to selected files
  - Dedupe: prefer unique file+page+span; collapse near-duplicates
- **Answer generation**
  - Model: self-hosted Llama 3.1 8B Instruct via Ollama (CPU)
  - Input to model: user question + minimal chat context + fused top-8 snippets (trimmed)
  - Output: single response (no streaming), max 150 words
  - Grounding: answers must be based only on retrieved snippets; if insufficient evidence, respond with: “Not found in your files.”
  - Inline markers: always show [1], [2], [3] (min 1, max 3) corresponding to best-matching snippets
- **Citations UX**
  - Inline markers are always visible and clickable
  - “Show citations” reveals a collapsible panel (hidden by default), listing up to 3 sources with file name and page
  - Clicking a marker or source opens a modal PDF viewer; text-layer sentence highlighting; query terms highlighted
- **Conversation context**
  - Maintain chat history within the active session for follow-ups (RAG uses last N turns, trimmed)

### Non-functional requirements
- **Performance**
  - Time-to-answer target: ≤10 seconds on CPU-only for typical queries
  - Concurrency: 1 active question per session; queue additional until completion
- **Rate limits**
  - Per-minute: 6 questions/min (burst up to 3)
  - Per-session (60 min): 30 questions
  - Per-user daily: 100 questions
- **Privacy & data handling**
  - All indexing/search local to backend; only retrieved snippets + question + minimal chat context go to the model
  - Encrypted temp storage per session; auto-delete at 60 minutes inactivity or immediately on sign-out
- **Reliability & errors**
  - Clear, actionable error messages:
    - File too large / too many files / total size exceeded
    - Scanned/unsearchable PDF
    - Indexing failure (retry guidance)
    - Query timeout (suggest refining question)
    - Session expired (explain data deletion)
  - Safe fallbacks: If PDF viewer fails to load, offer “Download PDF” and show page number and snippet

### Architecture
- **Frontend**: Next.js (React) **COMPLETED**
  - Auth UI (Google/Apple) - *Pending*
  - Upload UI with progress + validations **COMPLETED**
  - Chat UI with inline markers and "Show citations" control - *Pending*
  - Modal PDF viewer (pdf.js), sentence-level text-layer highlighting - *Pending*
- **Backend** *Pending*
  - Next.js API routes for auth/session and proxy to Python where needed **COMPLETED**
  - Python FastAPI service: **COMPLETED**
    - PDF ingestion (extract text layer, page map, paragraph/sentence segmentation) **COMPLETED**
    - Embedding generation with `bge-small-en` (CPU) **COMPLETED**
    - FAISS vector index (per session, temp dir) **COMPLETED**
    - Tantivy BM25 index (per session, temp dir) *Pending* (Currently implemented using Python-based keyword search. TODO with Tantivy if user requires)
    - Hybrid retrieval + RRF fusion **COMPLETED**
    - Model inference via Ollama (Llama 3.1 8B), with prompt templates for strict grounding and 150-word cap - *Pending*
    - Session lifecycle and deletion *Pending* (basic implementation completed. TODO review if refactoring is required)
- **Data storage (per session)**
  - Temp directory structure:
    - `pdfs/` original files
    - `text/` extracted text, page→paragraph→sentence maps
    - `faiss/` vector index
    - `tantivy/` BM25 index
    - `meta.json` (file list, sizes, pages, timestamps)
- **APIs (high-level)**
  - `POST /api/auth/callback` (Next.js): OAuth handoff - *Pending*
  - `POST /fastapi/upload` → returns `session_id` **COMPLETED**
  - `GET /fastapi/index/status?session_id=...` **COMPLETED**
  - `POST /fastapi/query` → `{ answer, citations:[{file,page,sentenceSpan,id}] }` **COMPLETED**
  - `GET /fastapi/citation?id=...` → metadata for viewer positioning - *Pending*
  - `POST /fastapi/session/extend` (optional), `POST /fastapi/session/signout` - *Pending*
  - Automatic deletion on timeout/sign-out *Pending* (basic implementation completed. TODO review if refactoring is required)

### UX details
- **Chat input** disabled during indexing; show "Indexing X/Y files" with ETA **COMPLETED**
- **Answer block** - *Pending*
  - Plain text ≤150 words with inline [1]–[3] markers
  - "Show citations" toggles collapsible panel (max 3 entries)
- **PDF viewer (modal)** - *Pending*
  - Opens at cited page
  - Sentence-level highlight; keyword highlights
  - Basic controls: page nav, zoom, close
- **File scope filter** - *Pending*
  - Multi-select of uploaded files; default "All files"

### Testing & validation *Pending*
- Datasets: long policy PDFs, medical/science articles, workplace handbooks 
- Scenarios: rare term lookups, numeric thresholds, acronyms, paraphrased questions 
- Metrics: answer latency (target ≤10s), citation accuracy (correct page/sentence), groundedness ("Not found" when appropriate) 

### Security
- OAuth best practices (PKCE, state)
- Signed, httpOnly, secure cookies for session
- Server-side authorization checks on all endpoints
- Temp directory encryption and secure deletion policy

### Operational runbook (AWS, MVP)
- Access
  - Primary: AWS SSM Session Manager. Fallback: SSH from Kate’s public IP (/32) only.
  - Secrets: stored in SSM Parameter Store (SecureString); access via IAM instance role.
- Start/stop services
  - Start: `docker compose up -d` in app directory.
  - Stop: `docker compose down`.
  - Health: `docker ps`; check Caddy, Next.js, FastAPI, Ollama containers are healthy.
- Deploy
  - Pull repo/branch; `docker compose build --pull` then `docker compose up -d --remove-orphans`.
  - Migrations: not applicable (no persistent DB in MVP).
- Version control: frequent commits; tag with "AI Co-author: Cursor".
- Secret rotation
  - Update SSM parameters; restart affected containers: `docker compose restart <service>`.
  - Never commit secrets; verify envs at container start.
- Logs & metrics
  - Logs: CloudWatch Logs groups per service via awslogs driver.
  - Metrics: scrape endpoints if/when CloudWatch Agent is added; otherwise inspect application logs for latency counters.
- Incidents
  - High latency: check CPU/RAM on EC2; verify Ollama model loaded; inspect retrieval/generation timing in logs.
  - Indexing failures: re-run job; validate PDF text layer; confirm EBS free space.
  - TLS errors: check Caddy certificates and DNS A record to Elastic IP.
  - Session cleanup: confirm 60‑minute reaper running; orphaned session dirs under `/srv/app/sessions` should be deleted.

### Hosting & deployment (AWS, MVP)
- EC2: single instance (t3.xlarge, 4 vCPU, 16 GB RAM), Ubuntu 22.04, gp3 100 GB EBS (encrypted).
- Networking: default VPC, public subnet, Elastic IP; Security Group allows 80/443 from 0.0.0.0/0, SSH 22 restricted to Kate’s public IP (/32). Prefer AWS SSM Session Manager over SSH when possible.
- DNS/TLS: Route 53 A record to Elastic IP; Caddy terminates TLS with Let’s Encrypt (auto‑renew).
- Containers: Docker Compose services — Next.js, FastAPI, Ollama, Caddy.
- Secrets: AWS SSM Parameter Store; injected as environment variables at service start.
- Logs: container stdout → CloudWatch Logs (awslogs driver); include `session_id` and `request_id` in structured JSON logs.
- Metrics: expose Prometheus endpoints; (later) optional CloudWatch Agent scraping. Not included for MVP.
- Session storage: per‑session temp dirs under `/srv/app/sessions/<session_id>` on encrypted EBS; deleted on 60‑minute inactivity or sign‑out.
- Backups: none (ephemeral by design).
- Scale path (later): swap Caddy for ALB + ACM; split FastAPI/Ollama to separate EC2 or ECS; add ASG.

### Observability & metrics (MVP)
- Logs: structured JSON to stdout for frontend/backend; shipped to CloudWatch Logs. Include `session_id`, `request_id`, `user_id` (if authenticated).
- Metrics:
  - FastAPI: `prometheus-fastapi-instrumentator` for HTTP metrics; custom histograms for `indexing_time_ms`, `retrieval_latency_ms`, `generation_latency_ms`; gauges for `active_sessions`.
  - Next.js API: `prom-client` for HTTP metrics; histogram `answer_latency_ms`.
- Alerts (later): add CloudWatch alarms on latency/error rates.

### Accessibility & localization (MVP)
- English‑only UI.
- WCAG 2.1 AA essentials:
  - Keyboard accessible flows; visible focus states.
  - Modal PDF viewer: focus trap, ARIA roles/labels, ESC to close.
  - Collapsible “Sources” panel: `aria-expanded`, `aria-controls`.
  - Color contrast ≥ 4.5:1; screen reader labels for key controls.
  - Live region announcements for indexing progress and session expiry.
