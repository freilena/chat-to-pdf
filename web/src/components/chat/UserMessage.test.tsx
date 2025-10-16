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
});
