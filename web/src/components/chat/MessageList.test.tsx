import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageList } from './MessageList';

// Mock messages data
const mockMessages = [
  {
    id: '1',
    type: 'user' as const,
    content: 'What is the main topic?',
    timestamp: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: '2',
    type: 'assistant' as const,
    content: 'The main topic is artificial intelligence.',
    timestamp: new Date('2024-01-01T10:01:00Z'),
  },
  {
    id: '3',
    type: 'system' as const,
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
});
