import { useState, useCallback } from 'react';
import { Message } from '@/components/chat/MessageList';
import { submitQuery, QueryResponse } from '@/lib/api/query';
import { useSession } from './useSession';

// Helper function to truncate text to 500 words (more reasonable limit)
function truncateToWords(text: string, maxWords: number = 500): string {
  const words = text.split(' ');
  if (words.length <= maxWords) {
    return text;
  }
  return words.slice(0, maxWords).join(' ') + '...';
}

// Helper function to get appropriate error message
function getErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('timeout')) {
    return 'The request timed out. Please try again with a shorter question.';
  }
  
  if (message.includes('processing') || message.includes('query')) {
    return 'Sorry, there was an error processing your question. Please try again.';
  }
  
  return 'Sorry, there was an error processing your question. Please try again.';
}

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
      
      // Truncate response to 150 words if needed
      const truncatedAnswer = truncateToWords(response.answer);
      
      // Add assistant response
      const assistantMessage: Message = {
        id: generateMessageId(),
        type: 'assistant',
        content: truncatedAnswer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Query submission failed:', error);
      
      // Get appropriate error message based on error type
      const errorMessage = error instanceof Error ? getErrorMessage(error) : 'Sorry, there was an error processing your question. Please try again.';
      
      // Add error message
      const systemMessage: Message = {
        id: generateMessageId(),
        type: 'system',
        content: errorMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, systemMessage]);
      
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
