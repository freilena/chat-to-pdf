import React, { useEffect, useRef } from 'react';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { SystemMessage } from './SystemMessage';

export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  scrollToBottom?: () => void;
}

export function MessageList({ messages, isLoading = false, scrollToBottom }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll when messages or loading state changes
    // Use both scrollIntoView and parent scrollToBottom for maximum reliability
    const scroll = () => {
      // Try scrolling sentinel into view (this scrolls the nearest scrollable ancestor)
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' });
      }
      // Also call parent scrollToBottom to scroll the container directly
      if (scrollToBottom) {
        scrollToBottom();
      }
    };

    // Scroll multiple times to ensure it works
    scroll();
    
    const timeout1 = setTimeout(() => {
      scroll();
    }, 50);
    
    const timeout2 = setTimeout(() => {
      scroll();
    }, 150);
    
    const timeout3 = setTimeout(() => {
      scroll();
    }, 300);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [messages, isLoading, scrollToBottom]);

  if (messages.length === 0) {
    return (
      <div data-testid="message-list" className="message-list scrollable">
        <div className="empty-state">
          <p>No messages yet. Start a conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="message-list" className="message-list scrollable">
      {messages.map((message) => {
        switch (message.type) {
          case 'user':
            return (
              <UserMessage
                key={message.id}
                message={message.content}
                timestamp={message.timestamp}
              />
            );
          case 'assistant':
            return (
              <AssistantMessage
                key={message.id}
                message={message.content}
                timestamp={message.timestamp}
                isLoading={isLoading && message.id === messages[messages.length - 1]?.id}
              />
            );
          case 'system':
            return (
              <SystemMessage
                key={message.id}
                message={message.content}
                type="info"
              />
            );
          default:
            return null;
        }
      })}
      {isLoading && (
        <div data-testid="typing-indicator" className="typing-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="typing-text">AI is thinking...</span>
        </div>
      )}
      {/* Sentinel element for scrolling */}
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
}
