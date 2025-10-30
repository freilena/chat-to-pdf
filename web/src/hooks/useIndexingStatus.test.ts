import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import { useIndexingStatus } from './useIndexingStatus';

describe('useIndexingStatus', () => {
  beforeEach(() => {
    // Setup MSW handlers for API endpoints
    server.use(
      http.get('/api/index/status', ({ request }) => {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get('session_id');
        
        // Return done status for any valid session ID
        if (sessionId) {
          return HttpResponse.json({
            status: 'done',
            total_files: 1,
            files_indexed: 1,
          });
        }
        
        return HttpResponse.json({ error: 'Session not found' }, { status: 404 });
      })
    );
  });

  it('initializes with null status when no sessionId', () => {
    const { result } = renderHook(() => useIndexingStatus(null));

    expect(result.current.status).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isIndexing).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('has correct initial state', async () => {
    const { result } = renderHook(() => useIndexingStatus('test-session'));

    expect(result.current.status).toBeNull();
    expect(result.current.isLoading).toBe(true); // Initially loading when sessionId provided
    
    // Wait for the fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isIndexing).toBe(false);
    expect(result.current.isComplete).toBe(true);
    expect(result.current.hasError).toBe(false);
    expect(result.current.progress).toBe(100);
    expect(typeof result.current.refetch).toBe('function');
  });
});