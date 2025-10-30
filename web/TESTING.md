# Frontend Test Execution Guide

## Issue: Tests Hang

Frontend tests may hang due to:
- MSW (Mock Service Worker) polling intervals
- React hooks with `setInterval`/`setTimeout` that don't clean up properly
- Async operations waiting indefinitely

## Solutions

### Option 1: Run Tests with Timeout (Recommended)

Use the timeout wrapper script:

```bash
./web/test-runner.sh
```

Or manually with timeout:

```bash
timeout 120 docker compose exec web npm run test
```

### Option 2: Run Tests Individually

Run specific test files to isolate issues:

```bash
# Single test file
docker compose exec web npm run test src/app/chat/page.test.tsx

# Multiple test files
docker compose exec web npm run test src/app/chat/page.test.tsx src/components/chat/MessageList.test.tsx
```

### Option 3: Run Tests Locally (if Docker hangs)

If Docker continues to hang, run tests locally:

```bash
cd web
npm install
npm run test
```

### Option 4: Debug Hanging Tests

To identify which test is hanging:

```bash
# Run with verbose output
docker compose exec web npm run test -- --reporter=verbose

# Run single test file
docker compose exec web npm run test src/app/chat/page.test.tsx
```

## What We Fixed

1. ✅ Added MSW handlers for `/api/index/status` endpoint
2. ✅ Changed MSW `onUnhandledRequest` from `'error'` to `'warn'` to prevent hanging
3. ✅ Added test timeouts (10s per test)
4. ✅ Fixed MessageList tests (mocked `scrollIntoView`)
5. ✅ Updated UploadPanel test to match new button behavior
6. ✅ Fixed ChatInput timeout issues

## Test Configuration

- **Test Timeout**: 10 seconds per test
- **Hook Timeout**: 10 seconds
- **Teardown Timeout**: 5 seconds
- **MSW**: Configured with `onUnhandledRequest: 'warn'`

## Known Issues

- Some tests may still hang if components with polling intervals don't unmount properly
- Solution: Ensure tests properly clean up components or mock intervals in tests

