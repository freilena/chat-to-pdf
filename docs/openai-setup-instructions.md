# OpenAI Integration Setup & Testing

## Quick Setup

### 1. Set API Key

```bash
export OPENAI_API_KEY="your-api-key-here"

# Optional: Choose model (default: gpt-4o-mini)
export OPENAI_MODEL="gpt-4o-mini"  # Fast & cheap (recommended for testing)
# export OPENAI_MODEL="gpt-4o"      # More powerful (12x cost, use for comparison)
```

### 2. Build and Start Services

```bash
# Build API container with OpenAI dependency
docker compose build api

# Start all services
docker compose up -d

# Check services are running
docker compose ps
```

### 3. Verify OpenAI Health

```bash
curl http://localhost:8000/fastapi/openai/health | jq
```

**Expected Response**:
```json
{
  "status": "healthy",
  "api_available": true,
  "model": "gpt-4o-mini",
  "error_message": null,
  "last_check": "2025-10-28T..."
}
```

## Manual Integration Tests (2-3 queries)

### Test 1: Upload a PDF

```bash
# Upload a test PDF
curl -X POST http://localhost:8000/fastapi/upload \
  -F "files=@path/to/your/test.pdf"

# Save the session_id from response
```

**Expected**: `{"session_id": "...", "status": "indexing", ...}`

### Test 2: Check Indexing Status

```bash
# Replace SESSION_ID with actual value
curl "http://localhost:8000/fastapi/index/status?session_id=SESSION_ID"
```

**Wait until**: `{"status": "done", ...}`

### Test 3: Query with OpenAI

```bash
curl -X POST http://localhost:8000/fastapi/query \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "question": "What is the main topic of this document?",
    "conversation_history": []
  }' | jq
```

**Expected**: OpenAI-generated answer with citations

### Test 4: Follow-up Question (Context Test)

```bash
curl -X POST http://localhost:8000/fastapi/query \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "question": "Can you elaborate on that?",
    "conversation_history": [
      {
        "role": "user",
        "content": "What is the main topic?",
        "timestamp": "2025-10-28T10:00:00Z"
      },
      {
        "role": "assistant",
        "content": "The main topic is...",
        "timestamp": "2025-10-28T10:00:01Z"
      }
    ]
  }' | jq
```

**Expected**: Contextual response using conversation history

## Verify Logs

```bash
# Check API logs for OpenAI activity
docker compose logs api | grep -E "(OpenAI|✅|⚠️)"
```

**Look for**:
- `✅ Generated answer using OpenAI: ...`
- No authentication errors
- No rate limit warnings

## Run Automated Tests

```bash
# Backend tests (all mocked, no API cost)
docker compose exec api pytest -v

# Should see:
# - test_openai.py: 20+ tests passing
# - test_openai_endpoints.py: 5+ tests passing
```

## Troubleshooting

### Issue: "OPENAI_API_KEY not set"

```bash
# Verify environment variable
echo $OPENAI_API_KEY

# If empty, set it:
export OPENAI_API_KEY="your-key"

# Restart services
docker compose restart api
```

### Issue: "openai module not found"

```bash
# Rebuild API container
docker compose build api
docker compose up -d
```

### Issue: Authentication failed

1. Check API key validity in [OpenAI Dashboard](https://platform.openai.com/api-keys)
2. Ensure key has not expired
3. Verify no typos in key

## Cost Tracking

For these manual tests:
- Health check: ~$0.000001
- 2-3 queries: ~$0.0003-0.0005 total

**Total estimated cost**: < $0.001 (less than a tenth of a cent)

## Cleanup

```bash
# Stop services when done
docker compose down

# Remove test data (optional)
docker compose down -v
```

## What's Next?

After manual testing confirms everything works:

1. ✅ **All features implemented**
2. ✅ **Tests passing**
3. ✅ **Documentation complete**
4. 🔜 **Ready to merge feature branch**

Use the web UI at http://localhost:3000 to test the full chat experience!

