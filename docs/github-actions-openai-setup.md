# GitHub Actions Setup for OpenAI Integration

## Quick Setup Guide

This guide helps you configure GitHub Actions to run OpenAI integration tests automatically.

---

## Overview

The CI pipeline includes 3 OpenAI test stages:

| Stage | When | Tests | Cost | Required Secret |
|-------|------|-------|------|-----------------|
| **Core Backend Tests** | Every PR/push | 88 tests | $0 | No |
| **OpenAI Mocked Tests** | Every PR/push | 47 tests | $0 | No |
| **OpenAI Smoke Test** | Main branch only | 3 tests | ~$0.000001 | Yes |

---

## Step 1: Add GitHub Secret (Required for Smoke Tests)

### What You Need
- An OpenAI API key from https://platform.openai.com/api-keys
- Repository admin access

### Instructions

1. **Get Your OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)
   - ⚠️ Save it securely - you won't see it again!

2. **Add Secret to GitHub**
   ```
   Repository → Settings → Secrets and variables → Actions → New repository secret
   ```
   
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-...` (your full API key)
   - Click **Add secret**

3. **Verify Setup**
   - Push to main branch
   - Check Actions tab
   - "OpenAI Smoke Test" should run successfully

### Security Notes
✅ API key is encrypted and never exposed in logs  
✅ Only accessible to GitHub Actions workflows  
✅ Used only for smoke tests (minimal cost)  
✅ Can be rotated anytime

---

## Step 2: Understand the CI Pipeline

### Test Stages

#### 1. Core Backend Tests
**Runs**: Every PR and push  
**Duration**: ~2-3 minutes  
**Cost**: $0

```yaml
# Excludes tests that require real API calls
pytest tests/ -v \
  --ignore=tests/test_openai_smoke.py \
  --ignore=tests/test_e2e_openai_integration.py
```

**Coverage**:
- PDF processing
- Vector/keyword search
- Embeddings
- API endpoints
- Basic OpenAI integration (mocked)

#### 2. OpenAI Mocked Tests
**Runs**: Every PR and push  
**Duration**: ~1-2 minutes  
**Cost**: $0 (fully mocked)

```yaml
# Tests OpenAI integration without real API calls
pytest \
  tests/test_openai.py \
  tests/test_openai_endpoints.py \
  tests/test_openai_security.py \
  tests/test_query_with_openai.py \
  -v
```

**Coverage**:
- OpenAI client initialization
- Health checks
- Text generation
- Security (API key protection)
- Query integration
- Fallback mechanisms

**Test Breakdown**:
- `test_openai.py`: 15 tests - Client unit tests
- `test_openai_endpoints.py`: 4 tests - API endpoint tests
- `test_openai_security.py`: 19 tests - Security & edge cases
- `test_query_with_openai.py`: 9 tests - Query integration

#### 3. OpenAI Smoke Test (Real API)
**Runs**: Main branch  
**Duration**: ~30 seconds  
**Cost**: ~$0.000001 per run

```yaml
# Makes ONE real OpenAI API call to validate integration
pytest tests/test_openai_smoke.py -v -s
```

**Coverage**:
- Real OpenAI connection
- API key validation
- Model configuration

**How it works**:
- Directly tests `OpenAIClient` (no server required)
- Makes 1 real API call to OpenAI
- Perfect for CI environments

**Why limit to main + integration branch?**
- Minimizes API costs
- Validates production integration paths
- Full coverage already provided by mocked tests

---

## Step 3: Verify CI Status

### Check CI Results

After pushing code:

1. **Go to Actions Tab**
   ```
   Repository → Actions → CI workflow
   ```

2. **Expected Results**
   - ✅ Backend Linting
   - ✅ Backend Type Checking
   - ✅ Backend Tests (Core) - 88 tests
   - ✅ OpenAI Tests (Mocked) - 47 tests
   - ✅ OpenAI Smoke Test (main) - 3 tests
   - ✅ Frontend Linting
   - ✅ Frontend Type Checking
   - ✅ Frontend Tests

3. **Total Test Count**
   - **90 backend tests** (88 core + 2 E2E excluded from CI)
   - **47 OpenAI mocked tests** (run on every PR)
   - **3 smoke tests** (run on main branch)

### Troubleshooting

#### ❌ Smoke Test Fails: "Connection refused" or "localhost:8000"
**Problem**: Old version of smoke test tried to connect to running server  
**Solution**: 
- **Fixed in commit `daf1f9e`** - smoke test now uses OpenAI client directly
- Pull latest changes: `git pull origin feature/openai-integration`
- No server needed - works in CI environments

#### ❌ Smoke Test Fails: "OPENAI_API_KEY not set"
**Problem**: Secret not configured  
**Solution**: Follow Step 1 to add `OPENAI_API_KEY` secret

#### ❌ Smoke Test Fails: "Authentication failed"
**Problem**: Invalid API key  
**Solution**: 
1. Verify key is correct at https://platform.openai.com/api-keys
2. Update GitHub secret with new key
3. Re-run workflow

#### ❌ Mocked Tests Fail
**Problem**: Code issue (not API-related)  
**Solution**: 
1. Run locally: `docker compose exec api pytest tests/test_openai.py -v`
2. Fix failing tests
3. Push changes

#### ⏭️ Smoke Test Skipped
**Reason**: Not on main branch (expected behavior)  
**Action**: None needed - this is by design to save costs

---

## Step 4: Cost Management

### Cost Breakdown

| Test Type | Runs Per | Cost Per Run | Monthly Cost* |
|-----------|----------|--------------|---------------|
| Mocked Tests | Every push | $0 | $0 |
| Smoke Test | Main branch | ~$0.000001 | ~$0.0001 |
| **Total** | - | - | **~$0.0001** |

\* *Assumes ~100 pushes to main per month*

### Cost Optimization Strategies

1. **Default Strategy (Implemented)**
   - Mocked tests on all PRs: $0
   - Smoke test only on main: ~$0.000001 per run
   - E2E tests excluded from CI (manual only)

2. **If You Want to Reduce Costs Further**
   ```yaml
   # Remove smoke test from feature branches
   if: github.ref == 'refs/heads/main'
   ```

3. **If You Want More Coverage**
   ```yaml
   # Add manual workflow dispatch for E2E tests
   on:
     workflow_dispatch:
   ```

### Monitoring Costs

**OpenAI Dashboard**:
1. Go to https://platform.openai.com/usage
2. View API usage by date
3. Filter by `gpt-4o-mini` model
4. Smoke tests show as minimal usage

**Expected Usage**:
- 1 token per smoke test
- ~$0.000001 per test
- Negligible compared to development usage

---

## Step 5: Optional Enhancements

### Add Manual E2E Test Workflow

Create `.github/workflows/openai-e2e.yml`:

```yaml
name: OpenAI E2E Tests (Manual)

on:
  workflow_dispatch:  # Manual trigger only

jobs:
  openai-e2e:
    name: OpenAI End-to-End Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: 'api/requirements.txt'
      
      - name: Install dependencies
        working-directory: ./api
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt
      
      - name: Run E2E tests
        working-directory: ./api
        run: PYTHONPATH=. pytest tests/test_e2e_openai_integration.py -v -s
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          OPENAI_MODEL: "gpt-4o-mini"
      
      - name: Report cost
        if: always()
        run: echo "💰 E2E test cost - ~\$0.0005"
```

**Usage**: 
- Go to Actions tab
- Select "OpenAI E2E Tests (Manual)"
- Click "Run workflow"

**Cost**: ~$0.0005 per run

### Add Weekly Smoke Test

Add to `.github/workflows/ci.yml`:

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
```

**Benefit**: Catch API changes early  
**Cost**: ~$0.000004 per month

---

## Best Practices

### During Development
✅ Run mocked tests locally before pushing  
✅ Check CI status before merging PRs  
✅ Don't rely on smoke tests for development  
✅ Use E2E tests sparingly (high cost)

### For Production
✅ Ensure smoke test passes on main  
✅ Monitor OpenAI API usage dashboard  
✅ Rotate API keys regularly  
✅ Set up billing alerts on OpenAI account

### Cost Management
✅ Keep E2E tests manual-only  
✅ Limit smoke tests to main branch  
✅ Use mocked tests for rapid iteration  
✅ Monitor monthly API costs

---

## Summary

### What's Automated
- ✅ All mocked tests run on every PR ($0)
- ✅ Smoke test runs on main branch (~$0.000001)
- ✅ Full test coverage without excessive costs
- ✅ Security: API keys protected in GitHub Secrets

### What's Manual
- ⏸️ End-to-end tests (run manually, ~$0.0005)
- ⏸️ Performance tests (not implemented)
- ⏸️ Cost-intensive validation (manual only)

### Expected Costs
- **Per PR**: $0 (all mocked)
- **Per main push**: ~$0.000001
- **Monthly**: ~$0.0001 (100 pushes to main)
- **Annual**: ~$0.001 (one tenth of a cent)

---

## Quick Reference

### GitHub Secret Setup
```
Repository → Settings → Secrets → Actions → New secret
Name: OPENAI_API_KEY
Value: sk-...
```

### Local Testing
```bash
# Mocked tests (no cost)
docker compose exec api pytest tests/test_openai.py tests/test_openai_security.py -v

# Smoke test (minimal cost)
docker compose exec api pytest tests/test_openai_smoke.py -v -s

# E2E test (higher cost)
docker compose exec api pytest tests/test_e2e_openai_integration.py -v -s
```

### CI Workflow Files
- `.github/workflows/ci.yml` - Main CI pipeline
- `.github/workflows/pylint.yml` - Code quality analysis

### Documentation
- `docs/ci-documentation.md` - Full CI/CD documentation
- `docs/openai-test-coverage.md` - Test coverage details
- `docs/openai-test-review-summary.md` - Test review summary

---

## Need Help?

### Common Issues
- **Smoke test skipped**: Expected on non-main branches
- **Authentication error**: Check API key in GitHub Secrets
- **Tests fail locally but pass in CI**: Check environment variables

### Resources
- OpenAI API Keys: https://platform.openai.com/api-keys
- OpenAI Usage: https://platform.openai.com/usage
- GitHub Actions Docs: https://docs.github.com/en/actions
- Project Docs: `docs/` directory

---

**Status**: ✅ CI/CD Ready  
**Cost**: Minimal (~$0.0001/month)  
**Coverage**: Comprehensive (90 tests)  
**Security**: API keys protected

