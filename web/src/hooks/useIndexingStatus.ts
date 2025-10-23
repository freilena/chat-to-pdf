import { useState, useEffect, useCallback } from 'react';

export interface IndexingStatus {
  status: 'indexing' | 'done' | 'error';
  total_files: number;
  files_indexed: number;
  error?: string;
}

export interface UseIndexingStatusReturn {
  status: IndexingStatus | null;
  isLoading: boolean;
  isIndexing: boolean;
  isComplete: boolean;
  hasError: boolean;
  progress: number; // 0-100
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to poll indexing status for a session
 */
export function useIndexingStatus(sessionId: string | null): UseIndexingStatusReturn {
  const [status, setStatus] = useState<IndexingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!sessionId) {
      setStatus(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/index/status?session_id=${sessionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Session not found - this is normal when no PDFs are uploaded
          setStatus(null);
          setError(null);
          return;
        }
        throw new Error(`Failed to fetch status: ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch indexing status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Poll status every 2 seconds when indexing
  useEffect(() => {
    console.log('Polling effect triggered:', { sessionId, status });
    
    if (!sessionId || !status || status.status === 'done' || status.status === 'error') {
      console.log('Polling stopped:', { sessionId: !!sessionId, status: !!status, statusType: status?.status });
      return;
    }

    console.log('Starting polling for session:', sessionId);
    const interval = setInterval(fetchStatus, 2000);
    return () => {
      console.log('Clearing polling interval for session:', sessionId);
      clearInterval(interval);
    };
  }, [sessionId, status, fetchStatus]);

  // Initial fetch when sessionId changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isIndexing = status?.status === 'indexing';
  const isComplete = status?.status === 'done';
  const hasError = status?.status === 'error' || !!error;
  const progress = status?.total_files 
    ? Math.round((status.files_indexed / status.total_files) * 100)
    : 0;

  return {
    status,
    isLoading,
    isIndexing,
    isComplete,
    hasError,
    progress,
    error: error || status?.error || null,
    refetch: fetchStatus,
  };
}
