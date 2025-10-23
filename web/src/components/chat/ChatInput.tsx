import React, { useRef, useEffect, KeyboardEvent } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatInput({ 
  value, 
  onChange, 
  onSubmit, 
  disabled = false, 
  isLoading = false 
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(40, textarea.scrollHeight)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmedValue = value.trim();
    if (trimmedValue && !disabled && !isLoading) {
      onSubmit(trimmedValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const isSubmitDisabled = !value.trim() || disabled || isLoading;

  return (
    <div className="input-container">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question about your documents..."
        className="message-input"
        disabled={disabled}
        aria-label="Message input"
        rows={1}
        style={{ minHeight: '40px', resize: 'none' }}
      />
      <button
        onClick={handleSubmit}
        disabled={isSubmitDisabled}
        className="send-button"
        aria-label="Send message"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
