'use client';

import React, { useRef, useEffect } from 'react';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { IndexingStatus } from '@/components/chat/IndexingStatus';
import { useSession } from '@/hooks/useSession';
import { useChat } from '@/hooks/useChat';
import { useIndexingStatus } from '@/hooks/useIndexingStatus';

export default function ChatPage() {
  const { sessionId, isAuthenticated } = useSession();
  const { messages, inputValue, setInputValue, isLoading, handleSubmit } = useChat();
  const { status: indexingStatus, isIndexing, isComplete, hasError, progress } = useIndexingStatus(sessionId);
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
          isLoading={isLoading}
          scrollToBottom={scrollToBottom}
        />
        
        {/* Indexing Status */}
        {indexingStatus && (
          <IndexingStatus 
            status={indexingStatus} 
            progress={progress} 
          />
        )}
      </div>

      {/* Input Area */}
      <div data-testid="input-area" className="input-area">
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          disabled={isLoading || isIndexing}
          isLoading={isLoading}
        />
        
        {/* Indexing Message */}
        {isIndexing && (
          <div className="indexing-message" role="status" aria-live="polite">
            <p>Chat will be enabled once indexing completes...</p>
          </div>
        )}
        
        {/* Error Message */}
        {hasError && (
          <div className="error-message" role="alert" aria-live="polite">
            <p>Indexing failed. Please try uploading your files again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
