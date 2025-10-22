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

export interface QueryRequest {
  query: string;
  session_id: string;
}

/**
 * Submits a query to the backend API
 * @param query - The user's question
 * @param sessionId - The current session ID
 * @returns Promise<QueryResponse> - The response with answer and citations
 * @throws Error if the query fails
 */
export async function submitQuery(query: string, sessionId: string): Promise<QueryResponse> {
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
        query: trimmedQuery,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Query failed with status ${response.status}`);
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
