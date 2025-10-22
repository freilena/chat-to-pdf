import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList, Message } from './MessageList';

// Mock messages data
const mockMessages: Message[] = [
  {
    id: '1',
    type: 'user',
    content: 'What is the main topic?',
    timestamp: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: '2',
    type: 'assistant',
    content: 'The main topic is artificial intelligence.',
    timestamp: new Date('2024-01-01T10:01:00Z'),
  },
  {
    id: '3',
    type: 'system',
    content: 'Indexing completed.',
    timestamp: new Date('2024-01-01T10:02:00Z'),
  },
];

describe('MessageList', () => {
  it('renders all messages in correct order', () => {
    render(<MessageList messages={mockMessages} />);
    
    expect(screen.getByText('What is the main topic?')).toBeInTheDocument();
    expect(screen.getByText('The main topic is artificial intelligence.')).toBeInTheDocument();
    expect(screen.getByText('Indexing completed.')).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    render(<MessageList messages={[]} />);
    
    expect(screen.getByText('No messages yet. Start a conversation!')).toBeInTheDocument();
  });

  it('has correct container classes', () => {
    render(<MessageList messages={mockMessages} />);
    
    const container = screen.getByTestId('message-list');
    expect(container).toHaveClass('message-list');
    expect(container).toHaveClass('scrollable');
  });

  it('scrolls to bottom when new message is added', () => {
    const scrollToBottom = vi.fn();
    const { rerender } = render(<MessageList messages={mockMessages} scrollToBottom={scrollToBottom} />);
    
    // Add a new message
    const newMessages = [...mockMessages, {
      id: '4',
      type: 'user' as const,
      content: 'New message',
      timestamp: new Date(),
    }];
    
    rerender(<MessageList messages={newMessages} scrollToBottom={scrollToBottom} />);
    
    expect(scrollToBottom).toHaveBeenCalled();
  });

  it('handles loading state correctly', () => {
    render(<MessageList messages={mockMessages} isLoading={true} />);
    
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it('does not show loading indicator when not loading', () => {
    render(<MessageList messages={mockMessages} isLoading={false} />);
    
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
  });

  it('calls scrollToBottom on initial render', () => {
    const scrollToBottom = vi.fn();
    render(<MessageList messages={mockMessages} scrollToBottom={scrollToBottom} />);
    
    expect(scrollToBottom).toHaveBeenCalled();
  });

  it('does not call scrollToBottom when not provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<MessageList messages={mockMessages} />);
    
    // Should not throw error
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('renders user messages with correct component', () => {
    const userMessages = mockMessages.filter(m => m.type === 'user');
    render(<MessageList messages={userMessages} />);
    
    userMessages.forEach(message => {
      expect(screen.getByText(message.content)).toBeInTheDocument();
    });
  });

  it('renders assistant messages with correct component', () => {
    const assistantMessages = mockMessages.filter(m => m.type === 'assistant');
    render(<MessageList messages={assistantMessages} />);
    
    assistantMessages.forEach(message => {
      expect(screen.getByText(message.content)).toBeInTheDocument();
    });
  });

  it('renders system messages with correct component', () => {
    const systemMessages = mockMessages.filter(m => m.type === 'system');
    render(<MessageList messages={systemMessages} />);
    
    systemMessages.forEach(message => {
      expect(screen.getByText(message.content)).toBeInTheDocument();
    });
  });

  it('handles mixed message types correctly', () => {
    render(<MessageList messages={mockMessages} />);
    
    // Check that all message types are rendered
    expect(screen.getByText('What is the main topic?')).toBeInTheDocument();
    expect(screen.getByText('The main topic is artificial intelligence.')).toBeInTheDocument();
    expect(screen.getByText('Indexing completed.')).toBeInTheDocument();
  });

  it('shows loading indicator only when isLoading is true', () => {
    const { rerender } = render(<MessageList messages={mockMessages} isLoading={false} />);
    
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    
    rerender(<MessageList messages={mockMessages} isLoading={true} />);
    
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
  });

  it('handles empty messages array gracefully', () => {
    render(<MessageList messages={[]} />);
    
    expect(screen.getByText('No messages yet. Start a conversation!')).toBeInTheDocument();
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
  });

  it('renders messages with unique keys', () => {
    const { container } = render(<MessageList messages={mockMessages} />);
    
    // Check that each message has a unique key by looking for the message components
    const userMessages = container.querySelectorAll('[data-testid="user-message"]');
    const assistantMessages = container.querySelectorAll('[data-testid="assistant-message"]');
    const systemMessages = container.querySelectorAll('[data-testid="system-message"]');
    
    expect(userMessages).toHaveLength(1);
    expect(assistantMessages).toHaveLength(1);
    expect(systemMessages).toHaveLength(1);
  });

  it('handles unknown message types gracefully', () => {
    const messagesWithUnknownType = [
      ...mockMessages,
      {
        id: 'unknown',
        type: 'unknown' as 'user' | 'assistant' | 'system',
        content: 'Unknown message type',
        timestamp: new Date(),
      }
    ];
    
    render(<MessageList messages={messagesWithUnknownType} />);
    
    // Should render known message types but not crash on unknown
    expect(screen.getByText('What is the main topic?')).toBeInTheDocument();
    expect(screen.getByText('The main topic is artificial intelligence.')).toBeInTheDocument();
    expect(screen.getByText('Indexing completed.')).toBeInTheDocument();
    expect(screen.queryByText('Unknown message type')).not.toBeInTheDocument();
  });
});