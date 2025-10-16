import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatPage from './page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock session hook
vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    sessionId: 'test-session-123',
    isAuthenticated: true,
  }),
}));

describe('ChatPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders chat page with header and session info', () => {
    render(<ChatPage />);
    
    expect(screen.getByText('Chat to Your PDF')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
    expect(screen.getByText('Session: test-session-123')).toBeInTheDocument();
  });

  it('renders message container', () => {
    render(<ChatPage />);
    
    const messageContainer = screen.getByTestId('message-container');
    expect(messageContainer).toBeInTheDocument();
    expect(messageContainer).toHaveClass('message-container');
  });

  it('renders input area at bottom', () => {
    render(<ChatPage />);
    
    const inputArea = screen.getByTestId('input-area');
    expect(inputArea).toBeInTheDocument();
    expect(inputArea).toHaveClass('input-area');
  });

  it('shows empty state when no messages', () => {
    render(<ChatPage />);
    
    expect(screen.getByText('No messages yet. Start a conversation!')).toBeInTheDocument();
  });

  it('is responsive on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<ChatPage />);
    
    const chatContainer = screen.getByTestId('chat-container');
    expect(chatContainer).toHaveClass('mobile-responsive');
  });
});
