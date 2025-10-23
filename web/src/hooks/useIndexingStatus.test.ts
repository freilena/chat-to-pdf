import { renderHook } from '@testing-library/react';
import { useIndexingStatus } from './useIndexingStatus';

describe('useIndexingStatus', () => {
  it('initializes with null status when no sessionId', () => {
    const { result } = renderHook(() => useIndexingStatus(null));

    expect(result.current.status).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isIndexing).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useIndexingStatus('test-session'));

    expect(result.current.status).toBeNull();
    expect(result.current.isLoading).toBe(true); // Initially loading when sessionId provided
    expect(result.current.isIndexing).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.progress).toBe(0);
    expect(typeof result.current.refetch).toBe('function');
  });
});