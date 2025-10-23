import { useState, useCallback } from 'react';
import { Message } from '@/components/chat/MessageList';
import { submitQuery, QueryResponse } from '@/lib/api/query';
import { useSession } from './useSession';

export function useChat() {
  const { sessionId } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    
    // Don't submit empty or whitespace-only messages
    if (!trimmedInput || isLoading || !sessionId) {
      return;
    }

    // Add user message immediately (optimistic UI)
    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response: QueryResponse = await submitQuery(trimmedInput, sessionId);
      
      // Add assistant response
      const assistantMessage: Message = {
        id: generateMessageId(),
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Query submission failed:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: generateMessageId(),
        type: 'system',
        content: 'Sorry, there was an error processing your question. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      // Restore input value on error
      setInputValue(trimmedInput);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, sessionId, generateMessageId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    handleSubmit,
    clearMessages,
  };
}
