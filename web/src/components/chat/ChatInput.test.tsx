import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
  const mockOnSubmit = vi.fn();
  const mockOnInputChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input field and send button', () => {
    render(
      <ChatInput
        value=""
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    expect(screen.getByPlaceholderText('Ask a question about your documents...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });

  it('disables send button when input is empty', () => {
    render(
      <ChatInput
        value=""
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });

  it('enables send button when input has content', () => {
    render(
      <ChatInput
        value="Test message"
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
  });

  it('calls onChange when user types', async () => {
    const user = userEvent.setup();
    render(
      <ChatInput
        value=""
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('Ask a question about your documents...');
    await user.type(input, 'Hello');

    expect(mockOnInputChange).toHaveBeenCalledTimes(5); // One call per character
    expect(mockOnInputChange).toHaveBeenLastCalledWith('o'); // Last character
  });

  it('submits message on Enter key press', async () => {
    const user = userEvent.setup();
    render(
      <ChatInput
        value="Test message"
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('Ask a question about your documents...');
    await user.type(input, '{enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
  });

  it('creates new line on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(
      <ChatInput
        value=""
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('Ask a question about your documents...');
    await user.type(input, 'Line 1{shift>}{enter}{/shift}Line 2');

    expect(mockOnInputChange).toHaveBeenCalledTimes(13); // One call per character including newline
    expect(mockOnInputChange).toHaveBeenLastCalledWith('2'); // Last character
  });

  it('submits message on send button click', async () => {
    const user = userEvent.setup();
    render(
      <ChatInput
        value="Test message"
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    await user.click(sendButton);

    expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
  });

  it('clears input after successful submission', async () => {
    const user = userEvent.setup();
    const mockOnSubmitWithClear = vi.fn().mockImplementation(() => {
      // Simulate clearing input after submission
      mockOnInputChange('');
    });

    render(
      <ChatInput
        value="Test message"
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmitWithClear}
        disabled={false}
        isLoading={false}
      />
    );

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    await user.click(sendButton);

    expect(mockOnSubmitWithClear).toHaveBeenCalledWith('Test message');
    expect(mockOnInputChange).toHaveBeenCalledWith('');
  });

  it('disables input and button when disabled prop is true', () => {
    render(
      <ChatInput
        value="Test message"
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={true}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('Ask a question about your documents...');
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <ChatInput
        value="Test message"
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={true}
      />
    );

    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('auto-resizes textarea based on content', () => {
    render(
      <ChatInput
        value="Line 1\nLine 2\nLine 3"
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const textarea = screen.getByPlaceholderText('Ask a question about your documents...');
    expect(textarea).toHaveStyle({ minHeight: '40px' });
  });

  it('has proper accessibility attributes', () => {
    render(
      <ChatInput
        value=""
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const input = screen.getByPlaceholderText('Ask a question about your documents...');
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    expect(input).toHaveAttribute('aria-label', 'Message input');
    expect(sendButton).toHaveAttribute('aria-label', 'Send message');
  });

  it('prevents submission of empty or whitespace-only messages', async () => {
    const user = userEvent.setup();
    render(
      <ChatInput
        value="   "
        onChange={mockOnInputChange}
        onSubmit={mockOnSubmit}
        disabled={false}
        isLoading={false}
      />
    );

    const sendButton = screen.getByRole('button', { name: 'Send message' });
    await user.click(sendButton);

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
