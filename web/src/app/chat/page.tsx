'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { IndexingStatus } from '@/components/chat/IndexingStatus';
import { useSession } from '@/hooks/useSession';
import { useChat } from '@/hooks/useChat';
import { useIndexingStatus } from '@/hooks/useIndexingStatus';

export default function ChatPage() {
  const { sessionId, isAuthenticated } = useSession();
  const { messages, inputValue, setInputValue, isLoading, handleSubmit, clearMessages, conversationLength } = useChat();
  const { status: indexingStatus, isIndexing, hasError, progress } = useIndexingStatus(sessionId);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!isAuthenticated || !sessionId) {
    return (
      <div className="chat-container">
        <div className="empty-state">
          <h2>No PDFs uploaded yet</h2>
          <p>Please upload your PDF files first to start chatting.</p>
          <Link href="/" className="btn btn-primary">Go to Upload</Link>
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
            <div className="conversation-controls">
              {conversationLength > 0 && (
                <span className="conversation-length">
                  {conversationLength} messages
                </span>
              )}
              {conversationLength > 0 && (
                <button 
                  className="clear-conversation-btn"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear the conversation? This action cannot be undone.')) {
                      clearMessages();
                    }
                  }}
                  title="Clear conversation"
                >
                  Clear
                </button>
              )}
              <button className="sign-out-btn">Sign out</button>
            </div>
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
