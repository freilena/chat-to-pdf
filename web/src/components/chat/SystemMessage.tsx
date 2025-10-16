import React from 'react';

interface SystemMessageProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

export function SystemMessage({ message, type = 'info' }: SystemMessageProps) {
  return (
    <div data-testid="system-message" className={`system-message ${type}`}>
      <div className="message-content">
        {message}
      </div>
    </div>
  );
}
