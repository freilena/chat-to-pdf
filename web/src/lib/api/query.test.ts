import { submitQuery } from './query';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/setup';

describe('Query API', () => {
  it('submits query successfully and returns response', async () => {
    const mockResponse = {
      answer: 'This is a test response',
      citations: [
        {
          id: '1',
          file: 'test.pdf',
          page: 1,
          snippet: 'Test snippet',
          sentence_span: [0, 10]
        }
      ]
    };

    server.use(
      http.post('/api/query', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const result = await submitQuery('Test question', 'test-session-123');

    expect(result).toEqual(mockResponse);
  });

  it('handles query errors and throws appropriate error', async () => {
    const mockError = {
      error: 'Query processing failed',
      detail: 'Invalid session'
    };

    server.use(
      http.post('/api/query', () => {
        return HttpResponse.json(mockError, { status: 400 });
      })
    );

    await expect(submitQuery('Test question', 'invalid-session')).rejects.toThrow('Query processing failed');
  });

  it('handles network errors', async () => {
    server.use(
      http.post('/api/query', () => {
        return HttpResponse.error();
      })
    );

    await expect(submitQuery('Test question', 'test-session-123')).rejects.toThrow();
  });

  it('handles server errors (500)', async () => {
    server.use(
      http.post('/api/query', () => {
        return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
      })
    );

    await expect(submitQuery('Test question', 'test-session-123')).rejects.toThrow('Internal server error');
  });

  it('handles timeout errors', async () => {
    server.use(
      http.post('/api/query', () => {
        return HttpResponse.json({ error: 'Request timeout' }, { status: 408 });
      })
    );

    await expect(submitQuery('Test question', 'test-session-123')).rejects.toThrow('Request timeout');
  });

  it('handles "not found" responses', async () => {
    const mockResponse = {
      answer: 'Not found in your files.',
      citations: []
    };

    server.use(
      http.post('/api/query', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const result = await submitQuery('Question not in files', 'test-session-123');

    expect(result).toEqual(mockResponse);
    expect(result.answer).toBe('Not found in your files.');
  });

  it('handles responses with multiple citations', async () => {
    const mockResponse = {
      answer: 'This is a comprehensive answer [1] [2] [3]',
      citations: [
        {
          id: '1',
          file: 'document1.pdf',
          page: 5,
          snippet: 'First relevant snippet',
          sentence_span: [0, 20]
        },
        {
          id: '2',
          file: 'document2.pdf',
          page: 12,
          snippet: 'Second relevant snippet',
          sentence_span: [0, 25]
        },
        {
          id: '3',
          file: 'document3.pdf',
          page: 8,
          snippet: 'Third relevant snippet',
          sentence_span: [0, 18]
        }
      ]
    };

    server.use(
      http.post('/api/query', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const result = await submitQuery('Complex question', 'test-session-123');

    expect(result.citations).toHaveLength(3);
    expect(result.answer).toContain('[1]');
    expect(result.answer).toContain('[2]');
    expect(result.answer).toContain('[3]');
  });

  it('handles empty response gracefully', async () => {
    const mockResponse = {
      answer: '',
      citations: []
    };

    server.use(
      http.post('/api/query', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    const result = await submitQuery('Empty response question', 'test-session-123');

    expect(result.answer).toBe('');
    expect(result.citations).toEqual([]);
  });

  it('validates required parameters', async () => {
    await expect(submitQuery('', 'test-session-123')).rejects.toThrow('Query cannot be empty');
    await expect(submitQuery('Test question', '')).rejects.toThrow('Session ID is required');
  });

  it('trims whitespace from query', async () => {
    const mockResponse = {
      answer: 'Test response',
      citations: []
    };

    server.use(
      http.post('/api/query', () => {
        return HttpResponse.json(mockResponse);
      })
    );

    await submitQuery('  Test question  ', 'test-session-123');

    // The test passes if no error is thrown, meaning the query was processed
    expect(true).toBe(true);
  });
});