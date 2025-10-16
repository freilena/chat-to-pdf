import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemMessage } from './SystemMessage';

describe('SystemMessage', () => {
  it('renders system message with correct content', () => {
    const message = 'Indexing completed successfully. You can now ask questions about your documents.';
    render(<SystemMessage message={message} type="success" />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('has correct styling classes for success type', () => {
    const message = 'Success message';
    render(<SystemMessage message={message} type="success" />);
    
    const messageElement = screen.getByTestId('system-message');
    expect(messageElement).toHaveClass('system-message');
    expect(messageElement).toHaveClass('success');
  });

  it('has correct styling classes for error type', () => {
    const message = 'Error message';
    render(<SystemMessage message={message} type="error" />);
    
    const messageElement = screen.getByTestId('system-message');
    expect(messageElement).toHaveClass('system-message');
    expect(messageElement).toHaveClass('error');
  });

  it('has correct styling classes for info type', () => {
    const message = 'Info message';
    render(<SystemMessage message={message} type="info" />);
    
    const messageElement = screen.getByTestId('system-message');
    expect(messageElement).toHaveClass('system-message');
    expect(messageElement).toHaveClass('info');
  });

  it('renders with default type when not specified', () => {
    const message = 'Default message';
    render(<SystemMessage message={message} />);
    
    const messageElement = screen.getByTestId('system-message');
    expect(messageElement).toHaveClass('system-message');
    expect(messageElement).toHaveClass('info');
  });

  it('renders with proper structure', () => {
    const message = 'Test system message';
    render(<SystemMessage message={message} type="info" />);
    
    const messageElement = screen.getByTestId('system-message');
    const contentElement = screen.getByText(message);
    
    expect(messageElement).toContainElement(contentElement);
    expect(contentElement).toHaveClass('message-content');
  });

  it('handles empty message gracefully', () => {
    render(<SystemMessage message="" type="info" />);
    
    const messageElement = screen.getByTestId('system-message');
    expect(messageElement).toBeInTheDocument();
    // Check that the message content div exists even with empty content
    const contentElement = messageElement.querySelector('.message-content');
    expect(contentElement).toBeInTheDocument();
  });

  it('handles special characters in message', () => {
    const specialMessage = 'System message with special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
    render(<SystemMessage message={specialMessage} type="info" />);
    
    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  it('handles multiline messages', () => {
    const multilineMessage = 'Line 1\nLine 2\nLine 3';
    render(<SystemMessage message={multilineMessage} type="info" />);
    
    // Check that the multiline content is rendered correctly
    const messageElement = screen.getByTestId('system-message');
    const contentElement = messageElement.querySelector('.message-content');
    expect(contentElement?.textContent).toBe(multilineMessage);
  });

  it('handles long messages with proper wrapping', () => {
    const longMessage = 'This is a very long system message that should wrap properly and not overflow the container or cause any layout issues in the chat interface. It should handle multiple lines gracefully and maintain proper styling.';
    render(<SystemMessage message={longMessage} type="info" />);
    
    const messageElement = screen.getByText(longMessage);
    expect(messageElement).toHaveClass('message-content');
  });

  it('renders all message types correctly', () => {
    const testCases = [
      { type: 'success' as const, message: 'Success message' },
      { type: 'error' as const, message: 'Error message' },
      { type: 'info' as const, message: 'Info message' },
    ];

    testCases.forEach(({ type, message }) => {
      const { unmount } = render(<SystemMessage message={message} type={type} />);
      
      const messageElement = screen.getByTestId('system-message');
      expect(messageElement).toHaveClass('system-message');
      expect(messageElement).toHaveClass(type);
      expect(screen.getByText(message)).toBeInTheDocument();
      
      unmount();
    });
  });

  it('has proper accessibility attributes', () => {
    const message = 'Test system message';
    render(<SystemMessage message={message} type="info" />);
    
    const messageElement = screen.getByTestId('system-message');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement).toBeVisible();
  });

  it('renders without timestamp', () => {
    const message = 'System message without timestamp';
    render(<SystemMessage message={message} type="info" />);
    
    // Should not have timestamp element
    const messageElement = screen.getByTestId('system-message');
    const timestampElement = messageElement.querySelector('.message-timestamp');
    expect(timestampElement).not.toBeInTheDocument();
  });

  it('handles different message types with same content', () => {
    const message = 'Same content, different type';
    
    const { rerender } = render(<SystemMessage message={message} type="success" />);
    expect(screen.getByTestId('system-message')).toHaveClass('success');
    
    rerender(<SystemMessage message={message} type="error" />);
    expect(screen.getByTestId('system-message')).toHaveClass('error');
    
    rerender(<SystemMessage message={message} type="info" />);
    expect(screen.getByTestId('system-message')).toHaveClass('info');
  });

  it('maintains consistent styling across different types', () => {
    const message = 'Consistent styling test';
    const types = ['success', 'error', 'info'] as const;
    
    types.forEach((type) => {
      const { unmount } = render(<SystemMessage message={message} type={type} />);
      
      const messageElement = screen.getByTestId('system-message');
      expect(messageElement).toHaveClass('system-message');
      expect(messageElement).toHaveClass(type);
      
      const contentElement = screen.getByText(message);
      expect(contentElement).toHaveClass('message-content');
      
      unmount();
    });
  });
});