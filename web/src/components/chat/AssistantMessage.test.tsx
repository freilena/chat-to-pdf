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
});
