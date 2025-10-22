import React from 'react';

interface UserMessageProps {
  message: string;
  timestamp: Date;
}

export function UserMessage({ message, timestamp }: UserMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div data-testid="user-message" className="user-message message">
      <div className="message-content">
        {message}
      </div>
      <div className="message-timestamp">
        {formatTime(timestamp)}
      </div>
    </div>
  );
}
