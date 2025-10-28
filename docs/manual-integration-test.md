# Manual Integration Test Guide

## Prerequisites
- ✅ Services running: `docker compose ps`
- ✅ OPENAI_API_KEY set in `.env` file
- ✅ Health check passed: `curl http://localhost:8000/fastapi/openai/health`

## Test 1: Upload a PDF

```bash
# Upload any PDF file you have
curl -X POST http://localhost:8000/fastapi/upload \
  -F "files=@/path/to/your/document.pdf" \
  | python3 -m json.tool

# Save the session_id from the response
```

**Expected Response:**
```json
{
  "session_id": "abc-123-...",
  "status": "indexing",
  "total_files": 1,
  "files_indexed": 0
}
```

**Cost**: $0 (no OpenAI call)

---

## Test 2: Wait for Indexing & Check Status

```bash
# Replace SESSION_ID with actual value from Test 1
curl "http://localhost:8000/fastapi/index/status?session_id=SESSION_ID" \
  | python3 -m json.tool
```

**Expected Response:**
```json
{
  "status": "done",
  "total_files": 1,
  "files_indexed": 1
}
```

**Cost**: $0 (no OpenAI call)

---

## Test 3: Query with OpenAI (First Real API Call 💰)

```bash
# Ask a simple question about your document
curl -X POST http://localhost:8000/fastapi/query \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "question": "What is this document about?",
    "conversation_history": []
  }' | python3 -m json.tool
```

**Expected Response:**
```json
{
  "answer": "Based on your files: [AI-generated answer about the document]",
  "citations": [
    {
      "file": "document.pdf",
      "page": 1,
      "sentenceSpan": [0, 500],
      "id": "citation_1"
    }
  ]
}
```

**Cost**: ~$0.0002 (OpenAI API call)

**What to check:**
- ✅ Answer is relevant and makes sense
- ✅ Answer references content from your PDF
- ✅ Citations are returned
- ✅ No "fallback" message

---

## Test 4: Follow-up Question (With Context 💰)

```bash
# Ask a follow-up question with conversation history
curl -X POST http://localhost:8000/fastapi/query \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID",
    "question": "Can you provide more details?",
    "conversation_history": [
      {
        "role": "user",
        "content": "What is this document about?",
        "timestamp": "2025-10-28T10:00:00Z"
      },
      {
        "role": "assistant",
        "content": "The document is about...",
        "timestamp": "2025-10-28T10:00:01Z"
      }
    ]
  }' | python3 -m json.tool
```

**Expected**: OpenAI uses conversation context to provide a relevant follow-up answer

**Cost**: ~$0.0002 (OpenAI API call)

---

## Test 5: Test with Web UI 🎨

1. **Open browser**: http://localhost:3000
2. **Upload your PDF** using the upload panel
3. **Wait for indexing** to complete
4. **Ask questions** in the chat interface
5. **Verify** AI-generated responses appear

**Cost**: ~$0.0002 per message

---

## Total Estimated Cost

- Tests 1-2: **$0**
- Tests 3-4: **~$0.0004** (less than a tenth of a cent)
- Test 5: **~$0.001** if you ask 5 questions

**Total**: **< $0.002** (less than a quarter of a cent)

---

## Troubleshooting

### "Session not found"
- Check session_id is correct
- Session might have expired

### "Session still indexing"
- Wait a few more seconds
- Check indexing status endpoint

### "Fallback response" or generic answer
- OpenAI might be down
- Check `/fastapi/openai/health`
- Verify API key has credits

### Answer not relevant to document
- Hybrid search might not be finding good chunks
- Try more specific questions
- Check that PDF has searchable text (not scanned)

---

## Success Criteria ✅

- [x] Health check shows "healthy"
- [x] PDF uploads successfully
- [x] Indexing completes
- [x] Query returns AI-generated answer (not fallback)
- [x] Answer is relevant to document content
- [x] Citations are returned
- [x] Follow-up questions work with context
- [x] Web UI chat works end-to-end

---

## Next Steps

After successful testing:
1. Commit final fixes
2. Update documentation
3. Merge feature branch to main
4. Consider deployment options

