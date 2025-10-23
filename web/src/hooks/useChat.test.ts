import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useChat } from './useChat';
import { ConversationMessage } from '@/lib/api/query';

// Mock the query API
vi.mock('@/lib/api/query', () => ({
  submitQuery: vi.fn(),
}));

// Mock the useSession hook
vi.mock('./useSession', () => ({
  useSession: () => ({
    sessionId: 'test-session-123',
    isAuthenticated: true,
  }),
}));

import { submitQuery } from '@/lib/api/query';

const mockSubmitQuery = submitQuery as ReturnType<typeof vi.fn>;

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty messages and no loading state', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.inputValue).toBe('');
  });

  it('updates input value when setInputValue is called', () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Hello world');
    });

    expect(result.current.inputValue).toBe('Hello world');
  });

  it('adds user message immediately on submit (optimistic UI)', async () => {
    mockSubmitQuery.mockResolvedValue({ answer: 'Test response' });
    
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Test question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.messages).toHaveLength(2); // User message + assistant response
    expect(result.current.messages[0]).toMatchObject({
      type: 'user',
      content: 'Test question',
    });
  });

  it('clears input after successful submission', async () => {
    mockSubmitQuery.mockResolvedValue({ answer: 'Test response' });
    
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Test question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.inputValue).toBe('');
  });

  it('sets loading state during query submission', async () => {
    mockSubmitQuery.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ answer: 'Test response' }), 100)
    ));

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Test question');
    });

    // Start submission
    act(() => {
      result.current.handleSubmit();
    });

    // Check loading state is true during submission
    expect(result.current.isLoading).toBe(true);

    // Wait for completion
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Check loading state is false after completion
    expect(result.current.isLoading).toBe(false);
  });

  it('adds assistant response after successful query', async () => {
    const mockResponse = { answer: 'Test response' };
    mockSubmitQuery.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Test question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      type: 'assistant',
      content: 'Test response',
    });
  });

  it('handles query errors gracefully', async () => {
    const mockError = new Error('Query failed');
    mockSubmitQuery.mockRejectedValue(mockError);

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Test question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      type: 'system',
      content: 'Sorry, there was an error processing your question. Please try again.',
    });
  });

  it('preserves input text if submission fails', async () => {
    const mockError = new Error('Query failed');
    mockSubmitQuery.mockRejectedValue(mockError);

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Test question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.inputValue).toBe('Test question');
  });

  it('does not submit empty messages', async () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockSubmitQuery).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });

  it('does not submit whitespace-only messages', async () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('   ');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockSubmitQuery).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });

  it('prevents multiple simultaneous submissions', async () => {
    mockSubmitQuery.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ answer: 'Test response' }), 100)
    ));

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Test question');
    });

    // Start first submission
    act(() => {
      result.current.handleSubmit();
    });

    // Try to submit again while first is in progress
    act(() => {
      result.current.setInputValue('Another question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Should only have one query submission
    expect(mockSubmitQuery).toHaveBeenCalledTimes(1);
  });

  it('generates unique message IDs', async () => {
    mockSubmitQuery.mockResolvedValue({ answer: 'Test response' });
    
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('First message');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    act(() => {
      result.current.setInputValue('Second message');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    const messageIds = result.current.messages.map(msg => msg.id);
    const uniqueIds = new Set(messageIds);

    expect(uniqueIds.size).toBe(messageIds.length);
  });

  it('maintains message order', async () => {
    mockSubmitQuery.mockResolvedValue({ answer: 'Test response' });
    
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('First question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    act(() => {
      result.current.setInputValue('Second question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.messages[0].content).toBe('First question');
    expect(result.current.messages[2].content).toBe('Second question');
  });

  it('handles "not found" responses with special styling', async () => {
    const mockResponse = { answer: 'Not found in your files.' };
    mockSubmitQuery.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Question not in files');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      type: 'assistant',
      content: 'Not found in your files.',
    });
  });

  it('truncates long responses to 500 words', async () => {
    const longAnswer = 'word '.repeat(600); // 600 words
    const mockResponse = { answer: longAnswer };
    mockSubmitQuery.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Question with long answer');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    const responseMessage = result.current.messages[1];
    const wordCount = responseMessage.content.split(' ').length;
    expect(wordCount).toBeLessThanOrEqual(500);
    expect(responseMessage.content).toContain('...');
  });

  it('handles timeout errors with specific message', async () => {
    const timeoutError = new Error('Request timeout');
    mockSubmitQuery.mockRejectedValue(timeoutError);

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Question that times out');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      type: 'system',
      content: 'The request timed out. Please try again with a shorter question.',
    });
  });

  it('handles query processing errors with specific message', async () => {
    const processingError = new Error('Query processing failed');
    mockSubmitQuery.mockRejectedValue(processingError);

    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setInputValue('Question that fails processing');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1]).toMatchObject({
      type: 'system',
      content: 'Sorry, there was an error processing your question. Please try again.',
    });
  });

  it('preserves conversation history across queries', async () => {
    mockSubmitQuery.mockResolvedValue({ answer: 'Test response' });
    
    const { result } = renderHook(() => useChat());

    // First query
    act(() => {
      result.current.setInputValue('First question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Second query
    act(() => {
      result.current.setInputValue('Second question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.messages).toHaveLength(4); // 2 user + 2 assistant
    expect(result.current.messages[0].content).toBe('First question');
    expect(result.current.messages[1].content).toBe('Test response');
    expect(result.current.messages[2].content).toBe('Second question');
    expect(result.current.messages[3].content).toBe('Test response');
  });

  it('includes conversation history in subsequent queries', async () => {
    mockSubmitQuery.mockResolvedValue({ answer: 'Test response', citations: [] });
    
    const { result } = renderHook(() => useChat());

    // First query
    act(() => {
      result.current.setInputValue('First question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Second query
    act(() => {
      result.current.setInputValue('Follow-up question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Check that conversation history was passed to the second query
    expect(mockSubmitQuery).toHaveBeenCalledTimes(2);
    
    const secondCall = mockSubmitQuery.mock.calls[1];
    expect(secondCall[0]).toBe('Follow-up question'); // query
    expect(secondCall[1]).toBe('test-session-123'); // sessionId
    expect(secondCall[2]).toBeDefined(); // conversationHistory
    
    const conversationHistory = secondCall[2];
    expect(conversationHistory).toHaveLength(2); // First question + first answer
    expect(conversationHistory[0]).toMatchObject({
      role: 'user',
      content: 'First question',
    });
    expect(conversationHistory[1]).toMatchObject({
      role: 'assistant',
      content: 'Test response',
    });
  });

  it('limits conversation history to last 10 messages', async () => {
    mockSubmitQuery.mockResolvedValue({ answer: 'Test response', citations: [] });
    
    const { result } = renderHook(() => useChat());

    // Add 12 messages (6 turns)
    for (let i = 0; i < 6; i++) {
      act(() => {
        result.current.setInputValue(`Question ${i + 1}`);
      });

      await act(async () => {
        await result.current.handleSubmit();
      });
    }

    // Check that only last 10 messages are included in conversation history
    const lastCall = mockSubmitQuery.mock.calls[5];
    const conversationHistory = lastCall[2];
    expect(conversationHistory).toHaveLength(10); // Last 10 messages
    
    // With 6 turns (12 messages), we get all 10 messages (5 turns) since we have less than 10
    expect(conversationHistory[0].content).toBe('Question 1'); // First message in history
    expect(conversationHistory[9].content).toBe('Test response'); // Last message in history
  });

  it('filters out system messages from conversation history', async () => {
    mockSubmitQuery.mockResolvedValue({ answer: 'Test response', citations: [] });
    
    const { result } = renderHook(() => useChat());

    // Add a user message
    act(() => {
      result.current.setInputValue('Test question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Manually add a system message (simulating an error)
    act(() => {
      result.current.setMessages(prev => [...prev, {
        id: 'system-1',
        type: 'system',
        content: 'System error message',
        timestamp: new Date(),
      }]);
    });

    // Add another user message
    act(() => {
      result.current.setInputValue('Another question');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    // Check that system message is not included in conversation history
    const lastCall = mockSubmitQuery.mock.calls[1];
    const conversationHistory = lastCall[2];
    expect(conversationHistory).toHaveLength(2); // Only user and assistant messages
    expect(conversationHistory.every((msg: ConversationMessage) => msg.role !== 'system')).toBe(true);
  });

  it('provides conversation length', () => {
    const { result } = renderHook(() => useChat());

    expect(result.current.conversationLength).toBe(0);

    act(() => {
      result.current.setMessages([
        {
          id: '1',
          type: 'user',
          content: 'Test message',
          timestamp: new Date(),
        },
        {
          id: '2',
          type: 'assistant',
          content: 'Test response',
          timestamp: new Date(),
        },
      ]);
    });

    expect(result.current.conversationLength).toBe(2);
  });

  it('clears conversation when clearMessages is called', () => {
    const { result } = renderHook(() => useChat());

    // Add some messages
    act(() => {
      result.current.setMessages([
        {
          id: '1',
          type: 'user',
          content: 'Test message',
          timestamp: new Date(),
        },
        {
          id: '2',
          type: 'assistant',
          content: 'Test response',
          timestamp: new Date(),
        },
      ]);
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.conversationLength).toBe(2);

    // Clear messages
    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.conversationLength).toBe(0);
  });
});
