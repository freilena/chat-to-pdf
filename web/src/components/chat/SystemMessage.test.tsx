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
});
