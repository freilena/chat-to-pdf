// Mock session hook for development
// This will be replaced with real implementation in later prompts

export function useSession() {
  return {
    sessionId: 'test-session-123',
    isAuthenticated: true,
  };
}
