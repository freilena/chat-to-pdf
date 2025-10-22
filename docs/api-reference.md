# API Reference - Chat Endpoints

## Overview

This document provides API reference for chat-related endpoints. Currently, the chat UI is implemented but backend integration is pending (Prompts 7-13).

## Current Status

- ✅ **Frontend Chat UI**: Complete (Prompt 6)
- ⏳ **Backend Chat APIs**: Pending (Prompts 7-13)

## Planned API Endpoints

### Chat Query Endpoint

**Endpoint**: `POST /fastapi/query`

**Purpose**: Submit a chat message and receive AI response with citations.

**Request Body**:
```json
{
  "message": "What is the main topic of the document?",
  "session_id": "session-123",
  "conversation_history": [
    {
      "role": "user",
      "content": "Previous question"
    },
    {
      "role": "assistant", 
      "content": "Previous answer"
    }
  ],
  "file_ids": ["file-1", "file-2"] // Optional: filter to specific files
}
```

**Response**:
```json
{
  "answer": "The main topic is artificial intelligence and machine learning [1].",
  "citations": [
    {
      "id": "citation-1",
      "file": "document.pdf",
      "page": 3,
      "sentence_span": [120, 180],
      "snippet": "Artificial intelligence represents a paradigm shift...",
      "query_terms": ["artificial", "intelligence", "topic"]
    }
  ],
  "session_id": "session-123",
  "timestamp": "2024-01-01T10:00:00Z"
}
```

**Status Codes**:
- `200` - Success
- `400` - Bad request (invalid message, missing session)
- `401` - Unauthorized (invalid session)
- `429` - Rate limited
- `500` - Server error

### Citation Metadata Endpoint

**Endpoint**: `GET /fastapi/citation?id={citation_id}`

**Purpose**: Get detailed citation metadata for PDF viewer.

**Query Parameters**:
- `id` (required): Citation ID from query response

**Response**:
```json
{
  "id": "citation-1",
  "file": "document.pdf",
  "file_path": "/sessions/session-123/pdfs/document.pdf",
  "page": 3,
  "sentence_span": [120, 180],
  "paragraph_text": "Full paragraph containing the cited sentence...",
  "query_terms": ["artificial", "intelligence"],
  "session_id": "session-123"
}
```

**Status Codes**:
- `200` - Success
- `404` - Citation not found
- `401` - Unauthorized (invalid session)
- `500` - Server error

## Frontend Integration

### Message Submission

```typescript
// Example: Submitting a chat message
const submitMessage = async (message: string) => {
  const response = await fetch('/fastapi/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionId}`
    },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      conversation_history: messages.slice(-10), // Last 10 messages
      file_ids: selectedFiles // Optional file filter
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit message');
  }
  
  const data = await response.json();
  return data;
};
```

### Citation Handling

```typescript
// Example: Fetching citation metadata
const fetchCitation = async (citationId: string) => {
  const response = await fetch(`/fastapi/citation?id=${citationId}`, {
    headers: {
      'Authorization': `Bearer ${sessionId}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch citation');
  }
  
  const citation = await response.json();
  return citation;
};
```

## Error Handling

### Common Error Responses

```json
{
  "error": "INVALID_SESSION",
  "message": "Session not found or expired",
  "code": 401,
  "timestamp": "2024-01-01T10:00:00Z"
}
```

```json
{
  "error": "RATE_LIMITED", 
  "message": "Too many requests. Please wait 60 seconds.",
  "code": 429,
  "retry_after": 60,
  "timestamp": "2024-01-01T10:00:00Z"
}
```

```json
{
  "error": "QUERY_TIMEOUT",
  "message": "Query processing timed out. Please try a more specific question.",
  "code": 408,
  "timestamp": "2024-01-01T10:00:00Z"
}
```

### Frontend Error Handling

```typescript
// Example: Error handling in chat component
const handleSubmitMessage = async (message: string) => {
  try {
    setLoading(true);
    const response = await submitMessage(message);
    
    // Add user message
    addMessage({
      id: generateId(),
      type: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Add assistant response
    addMessage({
      id: generateId(),
      type: 'assistant',
      content: response.answer,
      timestamp: new Date(),
      citations: response.citations
    });
    
  } catch (error) {
    // Add error message
    addMessage({
      id: generateId(),
      type: 'system',
      content: `Error: ${error.message}`,
      timestamp: new Date()
    });
  } finally {
    setLoading(false);
  }
};
```

## Rate Limiting

### Limits
- **Per minute**: 6 requests (burst up to 3)
- **Per session (60 min)**: 30 requests  
- **Per user daily**: 100 requests

### Headers
```
X-RateLimit-Limit: 6
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

### Frontend Handling

```typescript
// Example: Rate limit handling
const submitMessage = async (message: string) => {
  const response = await fetch('/fastapi/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionId}`
    },
    body: JSON.stringify({ message, session_id: sessionId })
  });
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    throw new Error(`Rate limited. Please wait ${retryAfter} seconds.`);
  }
  
  return response.json();
};
```

## Authentication

### Session Management
- Sessions are created on upload
- Session ID passed in Authorization header
- Sessions expire after 60 minutes of inactivity
- All chat requests require valid session

### Headers
```
Authorization: Bearer session-123
Content-Type: application/json
```

## WebSocket Support (Future)

### Planned Real-time Features
- Live typing indicators
- Real-time message updates
- Collaborative editing
- Live presence

### WebSocket Endpoint
```
ws://localhost:8000/ws/chat?session_id=session-123
```

### Message Types
```typescript
// Client to Server
interface ClientMessage {
  type: 'message' | 'typing' | 'stop_typing';
  content?: string;
  timestamp: string;
}

// Server to Client  
interface ServerMessage {
  type: 'message' | 'typing' | 'error' | 'citation_click';
  content?: string;
  citations?: Citation[];
  timestamp: string;
}
```

## Testing

### API Testing

```typescript
// Example: API endpoint tests
describe('Chat API', () => {
  it('should submit message and return response', async () => {
    const response = await request(app)
      .post('/fastapi/query')
      .send({
        message: 'What is the main topic?',
        session_id: 'test-session'
      })
      .expect(200);
      
    expect(response.body).toHaveProperty('answer');
    expect(response.body).toHaveProperty('citations');
  });
  
  it('should handle rate limiting', async () => {
    // Send multiple requests quickly
    const promises = Array(10).fill(0).map(() => 
      request(app).post('/fastapi/query').send({
        message: 'Test',
        session_id: 'test-session'
      })
    );
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### Frontend Integration Tests

```typescript
// Example: Frontend API integration tests
describe('Chat API Integration', () => {
  it('should submit message and update UI', async () => {
    const mockResponse = {
      answer: 'Test response',
      citations: []
    };
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    render(<ChatPage />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    const sendButton = screen.getByText('Send');
    
    fireEvent.change(input, { target: { value: 'Test question' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Test response')).toBeInTheDocument();
    });
  });
});
```

## Monitoring

### Metrics
- Request count per endpoint
- Response time percentiles
- Error rate by error type
- Rate limit violations
- Session creation/expiry

### Logging
```json
{
  "timestamp": "2024-01-01T10:00:00Z",
  "level": "INFO",
  "message": "Chat query processed",
  "session_id": "session-123",
  "request_id": "req-456",
  "query_length": 25,
  "response_time_ms": 1250,
  "citations_count": 2
}
```

### Health Checks
```
GET /fastapi/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T10:00:00Z",
  "services": {
    "database": "healthy",
    "embedding_model": "healthy", 
    "llm_service": "healthy"
  }
}
```
