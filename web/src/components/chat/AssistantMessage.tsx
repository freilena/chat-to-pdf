import React from 'react';

interface AssistantMessageProps {
  message: string;
  timestamp: Date;
  isLoading?: boolean;
}

export function AssistantMessage({ message, timestamp, isLoading = false }: AssistantMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div data-testid="assistant-message" className="assistant-message message">
      {isLoading ? (
        <div data-testid="typing-indicator" className="typing-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="typing-text">AI is thinking...</span>
        </div>
      ) : (
        <div className="message-content">
          {message}
        </div>
      )}
      <div className="message-timestamp">
        {formatTime(timestamp)}
      </div>
    </div>
  );
}
