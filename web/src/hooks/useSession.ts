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
    }
  }, []);

  return {
    sessionId,
    isAuthenticated,
  };
}
