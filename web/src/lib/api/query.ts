export interface QueryResponse {
  answer: string;
  citations: Citation[];
}

export interface Citation {
  id: string;
  file: string;
  page: number;
  snippet: string;
  sentence_span: [number, number];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface QueryRequest {
  query: string;
  session_id: string;
  conversation_history?: ConversationMessage[];
}

/**
 * Submits a query to the backend API
 * @param query - The user's question
 * @param sessionId - The current session ID
 * @param conversationHistory - Optional conversation history for context
 * @returns Promise<QueryResponse> - The response with answer and citations
 * @throws Error if the query fails
 */
export async function submitQuery(
  query: string, 
  sessionId: string, 
  conversationHistory?: ConversationMessage[]
): Promise<QueryResponse> {
  // Validate inputs
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }

  if (!sessionId || sessionId.trim().length === 0) {
    throw new Error('Session ID is required');
  }

  const trimmedQuery = query.trim();

  try {
    const response = await fetch('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: trimmedQuery,
        session_id: sessionId,
        conversation_history: conversationHistory || [],
      }),
    });

    if (!response.ok) {
      let errorMessage = `Query failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.detail || errorMessage;
      } catch {
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred while submitting query');
  }
}
