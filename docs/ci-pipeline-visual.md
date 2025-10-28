# CI/CD Pipeline Visual Overview

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI Pipeline                    │
│                  (Triggered on Push & Pull Request)              │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼────────┐            ┌────────▼────────┐
        │   BACKEND      │            │   FRONTEND      │
        │   (4 jobs)     │            │   (3 jobs)      │
        └───────┬────────┘            └────────┬────────┘
                │                               │
    ┌───────────┼───────────┬──────────┐       │
    │           │           │          │       │
    ▼           ▼           ▼          ▼       ▼
┌────────┐ ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐
│ Lint   │ │ Type   │ │ Tests   │ │ OpenAI │ │ Front  │
│        │ │ Check  │ │ (Core)  │ │ Tests  │ │ -end   │
│ Ruff   │ │ MyPy   │ │ 88 test │ │ (Mock) │ │ Tests  │
│        │ │        │ │         │ │ 47 test│ │        │
└────────┘ └────────┘ └─────────┘ └────┬───┘ └────────┘
                                        │
                            ┌───────────▼────────────┐
                            │   Main Branch Only     │
                            │  OpenAI Smoke Test     │
                            │    (Real API)          │
                            │    3 tests             │
                            │  ~$0.000001 cost       │
                            └────────────────────────┘
```

---

## Job Details

### Backend Jobs (4 jobs)

#### 1. Backend Linting
- **Tool**: Ruff
- **Duration**: ~30s
- **Status**: ✅ Required
- **Runs**: Every PR/push

#### 2. Backend Type Checking
- **Tool**: MyPy
- **Duration**: ~30s
- **Status**: ✅ Required
- **Runs**: Every PR/push

#### 3. Backend Tests (Core)
- **Tests**: 88
- **Duration**: ~2-3 min
- **Cost**: $0
- **Excludes**: Real API tests
- **Status**: ✅ Required
- **Runs**: Every PR/push

#### 4. OpenAI Tests (Mocked)
- **Tests**: 47
- **Duration**: ~1-2 min
- **Cost**: $0 (fully mocked)
- **Coverage**: Client, endpoints, security, query integration
- **Status**: ✅ Required
- **Runs**: Every PR/push

#### 5. OpenAI Smoke Test (Conditional)
- **Tests**: 3
- **Duration**: ~30s
- **Cost**: ~$0.000001
- **Coverage**: Real API validation
- **Status**: ⚠️ Optional (main branch only)
- **Runs**: Main branch & feature/openai-integration
- **Secret**: Requires `OPENAI_API_KEY`

---

## Test Distribution

```
Total Backend Tests: 90
├── Core Tests (Non-OpenAI): 38 tests
├── OpenAI Mocked Tests: 47 tests
│   ├── Client Tests: 15
│   ├── Endpoint Tests: 4
│   ├── Security Tests: 19
│   └── Query Integration: 9
├── Smoke Tests (Real API): 3 tests
└── E2E Tests (Manual): 2 tests
```

---

## Cost Analysis

### Per Pipeline Run

| Trigger | Jobs | Tests | Cost | Frequency |
|---------|------|-------|------|-----------|
| PR/Push (feature branch) | 7 | 135 | $0 | High |
| Push to main | 8 | 138 | ~$0.000001 | Medium |
| Manual E2E | 1 | 2 | ~$0.0005 | Low |

### Monthly Estimate

**Assumptions**:
- 200 PR/feature pushes per month
- 100 main branch pushes per month
- 4 manual E2E runs per month

**Costs**:
- Feature branch runs: $0
- Main branch runs: $0.0001
- Manual E2E runs: $0.002
- **Total: ~$0.0021 per month**

---

## Pipeline Flow by Branch

### Feature Branch
```
Developer Push
    ↓
┌───────────────────────────────────────┐
│ 1. Backend Linting            ✅     │
│ 2. Backend Type Checking      ✅     │
│ 3. Backend Tests (Core)       ✅     │
│ 4. OpenAI Tests (Mocked)      ✅     │
│ 5. OpenAI Smoke Test          ⏭️ Skip│  ← Skipped on feature branches
│ 6. Frontend Linting           ✅     │
│ 7. Frontend Type Checking     ✅     │
│ 8. Frontend Tests             ✅     │
└───────────────────────────────────────┘
    ↓
All checks pass → Ready for review
Cost: $0
```

### Main Branch
```
Merge to Main
    ↓
┌───────────────────────────────────────┐
│ 1. Backend Linting            ✅     │
│ 2. Backend Type Checking      ✅     │
│ 3. Backend Tests (Core)       ✅     │
│ 4. OpenAI Tests (Mocked)      ✅     │
│ 5. OpenAI Smoke Test          ✅     │  ← Runs on main
│ 6. Frontend Linting           ✅     │
│ 7. Frontend Type Checking     ✅     │
│ 8. Frontend Tests             ✅     │
└───────────────────────────────────────┘
    ↓
All checks pass → Production ready
Cost: ~$0.000001
```

---

## Test Coverage Map

### Mocked Tests (No Cost)
```
OpenAI Client
├── ✅ Initialization (env vars, explicit params)
├── ✅ Health checks (success, errors, caching)
├── ✅ Text generation (simple, with context, custom params)
└── ✅ Error handling (auth, rate limit, network)

Security
├── ✅ API key protection
├── ✅ Input sanitization (XSS, SQL injection, unicode)
├── ✅ Error disclosure
└── ✅ Concurrent requests

Query Integration
├── ✅ OpenAI usage in query endpoint
├── ✅ Conversation context handling
├── ✅ Prompt building
└── ✅ Fallback mechanism

Configuration
├── ✅ Model selection
├── ✅ Environment variables
└── ✅ Overrides
```

### Real API Tests (Minimal Cost)
```
Smoke Test (~$0.000001)
├── ✅ Connection validation (1 real API call)
├── ✅ API key format check
└── ✅ Model configuration

E2E Test (~$0.0005) - Manual Only
├── ⏸️ PDF upload + indexing
├── ⏸️ Query with OpenAI
└── ⏸️ Follow-up with context
```

---

## Conditional Execution Logic

### OpenAI Smoke Test
```yaml
# Only runs when:
if: github.ref == 'refs/heads/main' || 
    github.ref == 'refs/heads/feature/openai-integration'

# Skips when:
- Pull requests
- Feature branches (except openai-integration)
- Other branches
```

**Why?**
- ✅ Validates real API integration
- ✅ Minimizes costs
- ✅ Full coverage already via mocked tests
- ✅ Catches production issues early

---

## CI Status Indicators

### Pull Request Status
```
All checks passed (7 checks)
✅ Backend Linting
✅ Backend Type Checking  
✅ Backend Tests (Core) - 88 tests
✅ OpenAI Tests (Mocked) - 47 tests
⏭️ OpenAI Smoke Test - Skipped
✅ Frontend Linting
✅ Frontend Type Checking
✅ Frontend Tests
```

### Main Branch Status
```
All checks passed (8 checks)
✅ Backend Linting
✅ Backend Type Checking
✅ Backend Tests (Core) - 88 tests
✅ OpenAI Tests (Mocked) - 47 tests
✅ OpenAI Smoke Test - 3 tests ← Additional check
✅ Frontend Linting
✅ Frontend Type Checking
✅ Frontend Tests
```

---

## Performance Characteristics

### Average Execution Times

| Job | Duration | Caching Impact |
|-----|----------|----------------|
| Backend Linting | 30s | Low |
| Backend Type Checking | 30s | Low |
| Backend Tests (Core) | 2-3 min | High (embedding model) |
| OpenAI Tests (Mocked) | 1-2 min | Low |
| OpenAI Smoke Test | 30s | Low |
| Frontend Linting | 30s | Medium |
| Frontend Type Checking | 30s | Medium |
| Frontend Tests | 1 min | Medium |

**Total Pipeline Time**: ~3-4 minutes (parallel execution)

### Caching Strategy

```
Backend
├── Pip dependencies (keyed by requirements.txt)
└── Hugging Face model (all-MiniLM-L6-v2, ~80MB)

Frontend
└── NPM dependencies (keyed by package-lock.json)
```

---

## Security Features

### Secrets Management
```
GitHub Secrets
└── OPENAI_API_KEY
    ├── Encrypted at rest
    ├── Never exposed in logs
    ├── Only accessible to workflows
    └── Rotatable anytime
```

### API Key Protection
- ✅ Not hardcoded in workflow
- ✅ Retrieved from GitHub Secrets
- ✅ Used only for smoke tests
- ✅ Error messages sanitized

---

## Troubleshooting Flow

```
Test Failure
    ↓
┌──────────────────────┐
│ Which job failed?    │
└──────────────────────┘
    ↓
┌──────────────────────┬──────────────────────┐
│ Mocked Tests         │ Smoke Test           │
└──────────────────────┴──────────────────────┘
         ↓                       ↓
┌──────────────────┐    ┌────────────────────┐
│ Code issue       │    │ Check API key      │
│ Fix locally      │    │ Verify secret      │
│ Re-push          │    │ Check OpenAI       │
└──────────────────┘    └────────────────────┘
```

---

## Maintenance

### Regular Tasks
- ✅ Monitor OpenAI API usage monthly
- ✅ Review pipeline costs quarterly
- ✅ Update action versions quarterly
- ✅ Rotate API keys annually

### Scalability
- **Current**: 8 parallel jobs, ~4 min total
- **Can add**: Docker build validation (~10 min)
- **Can add**: Weekly security scans
- **Can add**: Performance benchmarks

---

## Quick Commands

### Check CI Status
```bash
# Via GitHub CLI
gh run list --workflow=ci.yml --limit 5

# Via GitHub UI
Repository → Actions → CI workflow
```

### Re-run Failed Jobs
```bash
# Via GitHub CLI
gh run rerun <run-id>

# Via GitHub UI
Actions → Failed run → Re-run failed jobs
```

### View Logs
```bash
# Via GitHub CLI
gh run view <run-id> --log

# Via GitHub UI
Actions → Run → Job → View logs
```

---

## Cost Optimization Checklist

- ✅ Mocked tests run on all PRs ($0)
- ✅ Smoke tests only on main branch
- ✅ E2E tests excluded from CI
- ✅ Caching enabled for dependencies
- ✅ Minimal API calls in smoke test (1 token)
- ✅ Parallel job execution
- ✅ Fast feedback loop

**Result**: ~$0.0021 per month for ~300 pipeline runs

---

## Future Enhancements

### Tier 1 (Ready to add)
- Weekly scheduled smoke test
- Manual E2E workflow dispatch
- Dependency vulnerability scanning

### Tier 2 (Consider for production)
- Docker build validation
- Performance regression testing
- Cost alerting (OpenAI usage)
- Slack/Discord notifications

### Tier 3 (Advanced)
- Multi-environment testing
- Canary deployments
- Load testing
- A/B testing framework

---

**Documentation**: Complete  
**Status**: ✅ Production Ready  
**Cost**: Minimal (~$0.0021/month)  
**Coverage**: Comprehensive (90 tests)  
**Security**: Protected (GitHub Secrets)

