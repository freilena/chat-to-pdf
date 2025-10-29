import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/setup';
import ChatPage from './page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock session hook
const mockUseSession = vi.fn();
vi.mock('@/hooks/useSession', () => ({
  useSession: () => mockUseSession(),
}));

describe('ChatPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseSession.mockReturnValue({
      sessionId: 'test-session-123',
      isAuthenticated: true,
    });

    // Setup MSW handlers for API endpoints
    server.use(
      http.get('/api/index/status', ({ request }) => {
        const url = new URL(request.url);
        const sessionId = url.searchParams.get('session_id');
        
        // Return done status for any valid session ID
        if (sessionId) {
          return HttpResponse.json({
            status: 'done',
            total_files: 1,
            files_indexed: 1,
          });
        }
        
        return HttpResponse.json({ error: 'Session not found' }, { status: 404 });
      })
    );
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

  it('shows authentication error when not authenticated', () => {
    mockUseSession.mockReturnValue({
      sessionId: null,
      isAuthenticated: false,
    });

    render(<ChatPage />);
    
    expect(screen.getByText('No PDFs uploaded yet')).toBeInTheDocument();
    expect(screen.getByText('Please upload your PDF files first to start chatting.')).toBeInTheDocument();
    expect(screen.queryByText('Chat to Your PDF')).not.toBeInTheDocument();
  });

  it('renders input field with correct attributes', () => {
    render(<ChatPage />);
    
    const textarea = screen.getByPlaceholderText('Ask a question about your documents...');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('rows', '1');
    expect(textarea).toHaveClass('message-input');
  });

  it('renders send button as disabled by default', () => {
    render(<ChatPage />);
    
    const sendButton = screen.getByRole('button', { name: 'Send message' });
    expect(sendButton).toBeInTheDocument();
    expect(sendButton).toBeDisabled();
    expect(sendButton).toHaveClass('send-button');
  });

  it('has proper accessibility attributes', () => {
    render(<ChatPage />);
    
    const chatContainer = screen.getByTestId('chat-container');
    expect(chatContainer).toHaveClass('chat-container');
    expect(chatContainer).toHaveClass('mobile-responsive');
  });

  it('displays session ID correctly', () => {
    const customSessionId = 'custom-session-456';
    mockUseSession.mockReturnValue({
      sessionId: customSessionId,
      isAuthenticated: true,
    });

    render(<ChatPage />);
    
    expect(screen.getByText(`Session: ${customSessionId}`)).toBeInTheDocument();
  });

  it('has proper header structure', () => {
    render(<ChatPage />);
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('chat-header');
    
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Chat to Your PDF');
  });

  it('has proper input area structure', () => {
    render(<ChatPage />);
    
    const inputArea = screen.getByTestId('input-area');
    expect(inputArea).toHaveClass('input-area');
    
    const inputContainer = inputArea.querySelector('.input-container');
    expect(inputContainer).toBeInTheDocument();
  });
});