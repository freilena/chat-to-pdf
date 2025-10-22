import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserMessage } from './UserMessage';

describe('UserMessage', () => {
  it('renders user message with correct content', () => {
    const message = 'What is the main topic of this document?';
    const timestamp = new Date('2024-01-01T10:00:00Z');
    render(<UserMessage message={message} timestamp={timestamp} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
    // Check that timestamp is formatted correctly (flexible for timezone)
    const expectedTime = timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    const message = 'Test message';
    render(<UserMessage message={message} timestamp={new Date()} />);
    
    const messageElement = screen.getByTestId('user-message');
    expect(messageElement).toHaveClass('user-message');
    expect(messageElement).toHaveClass('message');
  });

  it('formats timestamp correctly', () => {
    const timestamp = new Date('2024-01-01T14:30:00Z');
    render(<UserMessage message="Test" timestamp={timestamp} />);
    
    const expectedTime = timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('handles long messages with proper wrapping', () => {
    const longMessage = 'This is a very long message that should wrap properly and not overflow the container or cause any layout issues in the chat interface.';
    render(<UserMessage message={longMessage} timestamp={new Date()} />);
    
    const messageElement = screen.getByText(longMessage);
    expect(messageElement).toHaveClass('message-content');
  });

  it('renders with proper structure', () => {
    const message = 'Test message';
    const timestamp = new Date();
    render(<UserMessage message={message} timestamp={timestamp} />);
    
    const messageElement = screen.getByTestId('user-message');
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

  it('handles empty message gracefully', () => {
    const timestamp = new Date();
    render(<UserMessage message="" timestamp={timestamp} />);
    
    const messageElement = screen.getByTestId('user-message');
    expect(messageElement).toBeInTheDocument();
    // Check that the message content div exists even with empty content
    const contentElement = messageElement.querySelector('.message-content');
    expect(contentElement).toBeInTheDocument();
  });

  it('handles special characters in message', () => {
    const specialMessage = 'Message with special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
    render(<UserMessage message={specialMessage} timestamp={new Date()} />);
    
    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  it('handles multiline messages', () => {
    const multilineMessage = 'Line 1\nLine 2\nLine 3';
    render(<UserMessage message={multilineMessage} timestamp={new Date()} />);
    
    // Check that the multiline content is rendered correctly
    const messageElement = screen.getByTestId('user-message');
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
      const { unmount } = render(<UserMessage message={`Test ${index}`} timestamp={timestamp} />);
      
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
    const message = 'Test message';
    render(<UserMessage message={message} timestamp={new Date()} />);
    
    const messageElement = screen.getByTestId('user-message');
    expect(messageElement).toBeInTheDocument();
    // The element should be accessible to screen readers
    expect(messageElement).toBeVisible();
  });
});