'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageList, Message } from '@/components/chat/MessageList';
import { useSession } from '@/hooks/useSession';

export default function ChatPage() {
  const { sessionId, isAuthenticated } = useSession();
  const [messages] = useState<Message[]>([]);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isAuthenticated) {
    return (
      <div className="chat-container">
        <div className="error-message">
          <p>Please sign in to access the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="chat-container" className="chat-container mobile-responsive">
      {/* Header */}
      <header className="chat-header">
        <div className="header-content">
          <h1>Chat to Your PDF</h1>
          <div className="session-info">
            <span>Session: {sessionId}</span>
            <button className="sign-out-btn">Sign out</button>
          </div>
        </div>
      </header>

      {/* Message Container */}
      <div 
        ref={messageContainerRef}
        data-testid="message-container" 
        className="message-container"
      >
        <MessageList 
          messages={messages} 
          scrollToBottom={scrollToBottom}
        />
      </div>

      {/* Input Area */}
      <div data-testid="input-area" className="input-area">
        <div className="input-container">
          <textarea 
            placeholder="Ask a question about your documents..."
            className="message-input"
            rows={1}
          />
          <button className="send-button" disabled>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
