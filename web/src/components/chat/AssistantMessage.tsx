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

  // Determine if this is a "not found" message
  const isNotFoundMessage = message === 'Not found in your files.';
  
  // Determine if this is a truncated message (ends with "...")
  const isTruncatedMessage = message.endsWith('...') && message.split(' ').length > 400;

  // Build CSS classes
  const baseClasses = 'assistant-message message';
  const specialClasses = [];
  
  if (isNotFoundMessage) {
    specialClasses.push('not-found-message');
  }
  
  if (isTruncatedMessage) {
    specialClasses.push('truncated-message');
  }
  
  const className = [baseClasses, ...specialClasses].join(' ');

  return (
    <div data-testid="assistant-message" className={className}>
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
