// Session hook for development
// Gets session ID from localStorage (set by UploadPanel after successful upload)

import React from 'react';

export function useSession() {
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    // Get session ID from localStorage
    const storedSessionId = localStorage.getItem('pdf-chat-session-id');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      setIsAuthenticated(true);
    } else {
      setSessionId(null);
      setIsAuthenticated(false);
    }

    // Listen for localStorage changes (when session is set from UploadPanel)
    const handleStorageChange = () => {
      const newSessionId = localStorage.getItem('pdf-chat-session-id');
      if (newSessionId !== sessionId) {
        if (newSessionId) {
          setSessionId(newSessionId);
          setIsAuthenticated(true);
        } else {
          setSessionId(null);
          setIsAuthenticated(false);
        }
      }
    };

    // Listen for custom events (for same-tab changes)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sessionUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionUpdated', handleStorageChange);
    };
  }, [sessionId]);

  return {
    sessionId,
    isAuthenticated,
  };
}
