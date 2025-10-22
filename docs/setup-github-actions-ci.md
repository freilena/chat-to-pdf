# GitHub Actions CI Setup Instructions

## Overview
Set up Tier 1 CI checks (linting, type checking, tests) for the Chat-To-PDF project.

**Triggers:** All commits/pushes to any branch, pull requests, and pushes to main  
**Required for merge:** No (checks are informational only - can merge even if they fail)  
**Notifications:** GitHub UI only  
**Expected runtime:** 3-4 minutes (all jobs run in parallel)

---

## Step 1: Create GitHub Actions Directory Structure

**Location:** `/Users/kate/Documents/Projects/Chat-To-PDF/code/pdf-chat`

**Commands:**
```bash
cd /Users/kate/Documents/Projects/Chat-To-PDF/code/pdf-chat
mkdir -p .github/workflows
```

---

## Step 2: Create CI Workflow File

**File:** `.github/workflows/ci.yml`

**Content:**
```yaml
name: CI

on:
  push:           # Run on all commits/pushes to any branch
  pull_request:   # Run on all pull requests

jobs:
  backend-lint:
    name: Backend Linting
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
      
      - name: Run ruff linting
        working-directory: ./api
        run: ruff check .

  backend-typecheck:
    name: Backend Type Checking
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
      
      - name: Run mypy type checking
        working-directory: ./api
        run: mypy app

  backend-tests:
    name: Backend Tests
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
      
      - name: Cache embedding model
        uses: actions/cache@v4
        with:
          path: ~/.cache/huggingface
          key: ${{ runner.os }}-huggingface-all-MiniLM-L6-v2
      
      - name: Run pytest
        working-directory: ./api
        run: pytest tests/ -v

  frontend-lint:
    name: Frontend Linting
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'web/package-lock.json'
      
      - name: Install dependencies
        working-directory: ./web
        run: npm ci
      
      - name: Run eslint
        working-directory: ./web
        run: npm run lint

  frontend-typecheck:
    name: Frontend Type Checking
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'web/package-lock.json'
      
      - name: Install dependencies
        working-directory: ./web
        run: npm ci
      
      - name: Run TypeScript type checking
        working-directory: ./web
        run: npx tsc --noEmit

  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: 'web/package-lock.json'
      
      - name: Install dependencies
        working-directory: ./web
        run: npm ci
      
      - name: Run vitest
        working-directory: ./web
        run: npm run test
```

---

## Step 3: Commit the Workflow File

**Commands:**
```bash
cd /Users/kate/Documents/Projects/Chat-To-PDF/code/pdf-chat
git add .github/workflows/ci.yml
git commit -m "Add GitHub Actions CI workflow for Tier 1 checks

- Backend: ruff linting, mypy type checking, pytest tests
- Frontend: eslint linting, TypeScript type checking, vitest tests
- All jobs run in parallel on PRs and pushes to main
- Estimated runtime: 3-4 minutes
- Cache pip and npm dependencies for speed

AI Co-author: Cursor"
```

---

## Step 4: Push to GitHub

**Commands:**
```bash
cd /Users/kate/Documents/Projects/Chat-To-PDF/code/pdf-chat
git push origin feature/lighter-embedding-model
```

**Note:** The workflow will run on this push if you're creating a PR. Otherwise, it will run when you create a PR or merge to main.

---

## Step 5: Configure Branch Protection Rules (GitHub UI) - OPTIONAL

**Note:** This step is OPTIONAL. Currently, CI checks are informational only and do not block merges.

**If you want to enable blocking in the future:**

**Location:** GitHub.com → Repository Settings → Branches

**Steps:**
1. Navigate to: `https://github.com/<your-username>/Chat-To-PDF/settings/branches`
2. Click "Add rule" or "Add branch protection rule"
3. Enter branch name pattern: `main`
4. Check the following options:
   - ✅ "Require a pull request before merging"
   - ✅ "Require status checks to pass before merging"
   - ✅ "Require branches to be up to date before merging"
5. In the status checks search box, select all 6 jobs:
   - `Backend Linting`
   - `Backend Type Checking`
   - `Backend Tests`
   - `Frontend Linting`
   - `Frontend Type Checking`
   - `Frontend Tests`
6. Click "Create" or "Save changes"

**Note:** You need to run the workflow at least once before these checks appear in the list.

---

## Step 6: Verify Setup (Optional)

**Method 1: Create a test PR**
1. Make a small change (e.g., add a comment to a file)
2. Push to your feature branch
3. Create a PR to main
4. Verify all 6 checks run and pass
5. Verify you cannot merge until all checks pass

**Method 2: Check Actions tab**
1. Go to: `https://github.com/<your-username>/Chat-To-PDF/actions`
2. Verify the "CI" workflow appears
3. Click on a workflow run to see all 6 jobs

---

## Troubleshooting

### If backend tests fail with "model not found":
- The embedding model cache may need warming
- Re-run the job - it should pass on second attempt
- GitHub Actions will cache the model for future runs

### If frontend type checking fails:
- Ensure `next-env.d.ts` is committed to the repository
- This file is needed for Next.js type definitions

### If linting fails:
- Run locally first: `cd api && ruff check .`
- Run locally first: `cd web && npm run lint`
- Fix issues before pushing

### If you need to skip CI temporarily:
- **DON'T DO THIS** - violates working agreement Rule #1
- Always get Kate's explicit permission first

---

## Expected Behavior

**On every commit/push to any branch:**
- All 6 jobs run automatically
- Catch issues early, before creating PR
- Results visible in Actions tab and commit status

**On every PR:**
- All 6 jobs run automatically
- You see status checks in the PR
- Green checkmarks when all pass
- Red X when any fail
- **Can still merge even if checks fail** (checks are informational only)

**On push to main:**
- All 6 jobs run automatically
- Final safety check protecting main branch
- Results visible in Actions tab

**Runtime:**
- First run: ~5 minutes (cache warming)
- Subsequent runs: ~3-4 minutes (cached)
- All jobs run in parallel for speed

---

## Future Enhancements (Not Implemented Yet)

**Tier 2: Docker Build Validation**
- Add job to build Dockerfile.api and Dockerfile.web
- Verify Docker images build successfully
- Run only on PRs to main (not every push)
- Estimated time: ~10-15 minutes with caching

**Security Scanning**
- Add `pip-audit` for Python dependency vulnerabilities
- Add `npm audit` for Node dependency vulnerabilities
- Run weekly on schedule

**Integration Tests**
- Spin up full docker-compose stack
- Run end-to-end tests
- Run only on main branch after merge

---

## End of Instructions

All steps above must be executed in order. Each step depends on the previous step completing successfully.

