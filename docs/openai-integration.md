# OpenAI Integration Documentation

## Overview

The Chat-To-PDF application uses OpenAI's GPT-4o-mini model for AI-powered answer generation through Retrieval-Augmented Generation (RAG). This document describes the architecture, implementation, and usage of the OpenAI integration.

## Architecture

### Components

1. **OpenAI Client** (`api/app/openai_client.py`)
   - Wrapper around OpenAI API
   - Health checking with caching
   - Text generation with conversation context
   - Error handling for authentication, rate limits, and network issues

2. **Query Endpoint** (`/fastapi/query`)
   - Retrieves relevant document chunks using hybrid search
   - Builds context from top 3 search results
   - Generates AI responses using OpenAI
   - Returns answers with citations

3. **Health Endpoint** (`/fastapi/openai/health`)
   - Monitors OpenAI API availability
   - Reports model and configuration
   - Caches results for 30 seconds

## Configuration

### Environment Variables

```bash
# Required: Your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"

# Optional: Model selection (default: gpt-4o-mini)
export OPENAI_MODEL="gpt-4o-mini"
```

**OPENAI_API_KEY**: Required - The application will not generate AI responses without a valid API key.

**OPENAI_MODEL**: Optional - Defaults to `gpt-4o-mini`. Supported values:
- `gpt-4o-mini` - Fast, cost-effective (recommended for most use cases)
- `gpt-4o` - More powerful, 12x more expensive
- `gpt-4-turbo` - Most powerful, 40x more expensive
- `gpt-3.5-turbo` - Older, cheaper (not recommended)

### Model Configuration

- **Default Model**: `gpt-4o-mini`
  - Cost-effective OpenAI model
  - High-quality responses for Q&A tasks
  - Good balance of speed and quality
  - Configurable via `OPENAI_MODEL` environment variable
  
- **Parameters**:
  - `max_tokens`: 250 (default) - approximately 150-200 words
  - `temperature`: 0.7 - balanced creativity and consistency
  - `top_p`: 0.9 - nucleus sampling for diversity

### Comparing Models

Test different models to find the right balance for your use case:

```bash
# Test with gpt-4o-mini (default, fast & cheap)
export OPENAI_MODEL="gpt-4o-mini"
docker compose up -d

# Compare with gpt-4o (more powerful)
export OPENAI_MODEL="gpt-4o"
docker compose restart api
```

**Cost Comparison per 1000 queries**:
- `gpt-4o-mini`: ~$0.20
- `gpt-4o`: ~$2.50 (12x more)
- `gpt-4-turbo`: ~$8.00 (40x more)

### Context Management

- **Document Context**: Top 3 retrieved chunks (most relevant results)
- **Conversation Context**: Last 4 messages (2 conversation turns)
- **Context Truncation**: Automatically limits context to avoid token limits

## Usage

### Basic Query Flow

1. **User uploads PDFs** → Documents are indexed using hybrid search
2. **User asks question** → Hybrid retriever finds relevant chunks
3. **Context building** → Top chunks are formatted with citations
4. **OpenAI generation** → Answer is generated based on context
5. **Response returned** → Answer with citations sent to user

### Example API Call

```bash
curl -X POST http://localhost:8000/fastapi/query \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "question": "What is the main topic of the document?",
    "conversation_history": [
      {
        "role": "user",
        "content": "Hello",
        "timestamp": "2025-10-28T10:00:00Z"
      },
      {
        "role": "assistant",
        "content": "Hi! How can I help?",
        "timestamp": "2025-10-28T10:00:01Z"
      }
    ]
  }'
```

### Example Response

```json
{
  "answer": "Based on your documents, the main topic is...",
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

## Health Checking

### Endpoint

```bash
GET /fastapi/openai/health
```

### Response Format

```json
{
  "status": "healthy",
  "api_available": true,
  "model": "gpt-4o-mini",
  "error_message": null,
  "last_check": "2025-10-28T10:00:00Z"
}
```

### Status Values

- `healthy` - OpenAI API is accessible and responding
- `unhealthy` - OpenAI API has issues (auth, rate limit, etc.)
- `error` - Unexpected error occurred

### Caching

Health checks are cached for 30 seconds to avoid excessive API calls:

```python
# Use cached result (default)
health = await client.health_check()

# Force fresh check
health = await client.health_check(use_cache=False)
```

## Error Handling

### Authentication Errors

**Symptom**: `OpenAI authentication failed` error

**Causes**:
- Missing or invalid `OPENAI_API_KEY`
- Expired API key
- Insufficient permissions

**Resolution**:
1. Verify API key is set correctly
2. Check key validity in OpenAI dashboard
3. Ensure key has required permissions

### Rate Limit Errors

**Symptom**: `OpenAI rate limit exceeded` error

**Causes**:
- Too many requests in short period
- Exceeded account quota
- Tier limits reached

**Resolution**:
1. Implement request throttling
2. Upgrade OpenAI tier if needed
3. Wait for rate limit reset

### Fallback Behavior

If OpenAI fails, the system provides a fallback response:

```python
try:
    answer = await openai_client.generate_text(prompt, context)
except Exception as e:
    # Fallback to simple context display
    answer = f"Based on your files: {top_result[:500]}..."
```

## Cost Management

### Token Usage

- **Health checks**: 1 token each (minimal cost)
- **Query responses**: ~300-500 tokens per query
  - Input: 50-250 tokens (context + question)
  - Output: 250 tokens max

### Cost Estimates (GPT-4o-mini)

- **Health check**: ~$0.000001 per call
- **Query**: ~$0.0001-0.0002 per query
- **100 queries**: ~$0.01-0.02

### Best Practices

1. **Health check caching**: Reduces API calls by 97%+
2. **Context truncation**: Limits input tokens to essentials
3. **Max tokens limit**: Caps output to reasonable length
4. **Test mocking**: All tests use mocks (zero API cost)

## Testing

### Mocked Tests

All automated tests use mocks to avoid API costs:

```python
@pytest.mark.asyncio
async def test_generate_text_simple(client):
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content="Generated response"))]
    
    with patch.object(openai.ChatCompletion, 'acreate', 
                      new=AsyncMock(return_value=mock_response)):
        result = await client.generate_text("Test prompt")
        assert result == "Generated response"
```

### Manual Testing

For integration testing with real API:

1. **Set API key** in environment
2. **Start services**:
   ```bash
   docker compose up -d
   ```
3. **Run 2-3 test queries** (keep minimal for cost)
4. **Verify responses** are relevant and accurate

### Test Coverage

- 20+ unit tests for OpenAI client
- 5+ integration tests for endpoints
- All tests pass without API key (mocked)

## Troubleshooting

### Issue: "openai module not found"

**Solution**: Rebuild API container
```bash
docker compose build api
docker compose up -d
```

### Issue: "OPENAI_API_KEY not set"

**Solution**: Set environment variable before starting services
```bash
export OPENAI_API_KEY="your-key"
docker compose up -d
```

### Issue: Responses are irrelevant

**Causes**:
- Poor document chunking
- Weak hybrid search results
- Insufficient context

**Solutions**:
1. Check search results quality
2. Adjust retrieval parameters
3. Increase context chunks (from 3 to 5)

### Issue: Slow response times

**Causes**:
- Large context windows
- High max_tokens setting
- Network latency

**Solutions**:
1. Reduce max_tokens (e.g., 150)
2. Decrease context chunks
3. Use streaming responses (future enhancement)

## Future Enhancements

### Planned Features

1. **Streaming responses** - Real-time answer generation
2. **Token counting** - Accurate cost tracking
3. **Response caching** - Cache common queries
4. **Model selection** - Allow GPT-4 for complex questions
5. **Conversation memory** - Better context tracking
6. **Fine-tuning** - Custom model for domain-specific use

### Alternative Models

The architecture supports easy model switching:

```python
# Switch to GPT-4 for complex queries
client = OpenAIClient(model="gpt-4")

# Or use GPT-3.5-turbo for lower cost
client = OpenAIClient(model="gpt-3.5-turbo")
```

## References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT-4o-mini Pricing](https://openai.com/pricing)
- [Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

