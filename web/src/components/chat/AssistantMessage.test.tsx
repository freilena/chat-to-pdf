import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssistantMessage } from './AssistantMessage';

describe('AssistantMessage', () => {
  it('renders assistant message with correct content', () => {
    const message = 'Based on the document, the main topic is artificial intelligence and machine learning.';
    const timestamp = new Date('2024-01-01T10:00:00Z');
    render(<AssistantMessage message={message} timestamp={timestamp} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
    const expectedTime = timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    const message = 'Test response';
    render(<AssistantMessage message={message} timestamp={new Date()} />);
    
    const messageElement = screen.getByTestId('assistant-message');
    expect(messageElement).toHaveClass('assistant-message');
    expect(messageElement).toHaveClass('message');
  });

  it('shows loading state when isLoading is true', () => {
    render(<AssistantMessage message="" timestamp={new Date()} isLoading={true} />);
    
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
  });

  it('shows message content when not loading', () => {
    const message = 'Here is the answer to your question.';
    render(<AssistantMessage message={message} timestamp={new Date()} isLoading={false} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
  });

  it('formats timestamp correctly', () => {
    const timestamp = new Date('2024-01-01T09:15:00Z');
    render(<AssistantMessage message="Test" timestamp={timestamp} />);
    
    const expectedTime = timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('renders with proper structure when loading', () => {
    const timestamp = new Date();
    render(<AssistantMessage message="Test" timestamp={timestamp} isLoading={true} />);
    
    const messageElement = screen.getByTestId('assistant-message');
    const typingIndicator = screen.getByTestId('typing-indicator');
    const timestampElement = screen.getByText(timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }));
    
    expect(messageElement).toContainElement(typingIndicator);
    expect(messageElement).toContainElement(timestampElement);
    expect(typingIndicator).toHaveClass('typing-indicator');
  });

  it('renders with proper structure when not loading', () => {
    const message = 'Test response';
    const timestamp = new Date();
    render(<AssistantMessage message={message} timestamp={timestamp} isLoading={false} />);
    
    const messageElement = screen.getByTestId('assistant-message');
    const contentElement = screen.getByText(message);
    const timestampElement = screen.getByText(timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }));
    
    expect(messageElement).toContainElement(contentElement);
    expect(messageElement).toContainElement(timestampElement);
    expect(contentElement).toHaveClass('message-content');
    expect(timestampElement).toHaveClass('message-timestamp');
  });

  it('handles empty message when loading', () => {
    render(<AssistantMessage message="" timestamp={new Date()} isLoading={true} />);
    
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
  });

  it('handles empty message when not loading', () => {
    render(<AssistantMessage message="" timestamp={new Date()} isLoading={false} />);
    
    const messageElement = screen.getByTestId('assistant-message');
    expect(messageElement).toBeInTheDocument();
    // Check that the message content div exists even with empty content
    const contentElement = messageElement.querySelector('.message-content');
    expect(contentElement).toBeInTheDocument();
  });

  it('shows typing indicator with correct structure', () => {
    render(<AssistantMessage message="" timestamp={new Date()} isLoading={true} />);
    
    const typingIndicator = screen.getByTestId('typing-indicator');
    const typingDots = typingIndicator.querySelector('.typing-dots');
    const typingText = screen.getByText('AI is thinking...');
    
    expect(typingIndicator).toHaveClass('typing-indicator');
    expect(typingDots).toBeInTheDocument();
    expect(typingText).toHaveClass('typing-text');
    
    // Check that typing dots are present
    const dots = typingDots?.querySelectorAll('span');
    expect(dots).toHaveLength(3);
  });

  it('handles long messages with proper wrapping', () => {
    const longMessage = 'This is a very long assistant response that should wrap properly and not overflow the container or cause any layout issues in the chat interface. It should handle multiple lines gracefully.';
    render(<AssistantMessage message={longMessage} timestamp={new Date()} />);
    
    const messageElement = screen.getByText(longMessage);
    expect(messageElement).toHaveClass('message-content');
  });

  it('handles special characters in message', () => {
    const specialMessage = 'Response with special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
    render(<AssistantMessage message={specialMessage} timestamp={new Date()} />);
    
    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  it('handles multiline messages', () => {
    const multilineMessage = 'Line 1\nLine 2\nLine 3';
    render(<AssistantMessage message={multilineMessage} timestamp={new Date()} />);
    
    // Check that the multiline content is rendered correctly
    const messageElement = screen.getByTestId('assistant-message');
    const contentElement = messageElement.querySelector('.message-content');
    expect(contentElement?.textContent).toBe(multilineMessage);
  });

  it('formats different time formats correctly', () => {
    const testCases = [
      new Date('2024-01-01T00:00:00Z'), // Midnight
      new Date('2024-01-01T12:00:00Z'), // Noon
      new Date('2024-01-01T23:59:59Z'), // End of day
    ];

    testCases.forEach((timestamp, index) => {
      const { unmount } = render(<AssistantMessage message={`Test ${index}`} timestamp={timestamp} />);
      
      const expectedTime = timestamp.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      expect(screen.getByText(expectedTime)).toBeInTheDocument();
      
      unmount();
    });
  });

  it('has proper accessibility attributes', () => {
    const message = 'Test response';
    render(<AssistantMessage message={message} timestamp={new Date()} />);
    
    const messageElement = screen.getByTestId('assistant-message');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toBeVisible();
  });

  it('defaults to not loading when isLoading prop is not provided', () => {
    const message = 'Test response';
    render(<AssistantMessage message={message} timestamp={new Date()} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
  });

  it('renders "not found" message with special styling', () => {
    render(<AssistantMessage message="Not found in your files." timestamp={new Date()} />);
    
    const messageElement = screen.getByTestId('assistant-message');
    expect(messageElement).toHaveClass('assistant-message');
    expect(messageElement).toHaveClass('not-found-message');
    expect(screen.getByText('Not found in your files.')).toBeInTheDocument();
  });

  it('renders truncated message with ellipsis indicator', () => {
    const longMessage = 'word '.repeat(200) + 'end...';
    render(<AssistantMessage message={longMessage} timestamp={new Date()} />);
    
    const messageElement = screen.getByTestId('assistant-message');
    expect(messageElement).toHaveClass('assistant-message');
    expect(messageElement).toHaveClass('truncated-message');
    expect(screen.getByText(/word.*end\.\.\./)).toBeInTheDocument();
  });

  it('does not apply special styling for normal messages', () => {
    render(<AssistantMessage message="This is a normal response" timestamp={new Date()} />);
    
    const messageElement = screen.getByTestId('assistant-message');
    expect(messageElement).toHaveClass('assistant-message');
    expect(messageElement).not.toHaveClass('not-found-message');
    expect(messageElement).not.toHaveClass('truncated-message');
  });
});