/**
 * Tests for Login Page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import LoginPage from './page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  getSession: vi.fn(),
}));

describe('LoginPage', () => {
  const mockPush = vi.fn();
  const mockSignIn = signIn as any;
  const mockGetSession = getSession as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
  });

  it('should render login form', () => {
    mockGetSession.mockResolvedValue(null);
    
    render(<LoginPage />);
    
    expect(screen.getByText('Sign in to Chat to Your PDF')).toBeInTheDocument();
    expect(screen.getByText('Upload and chat with your PDF documents')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  it('should redirect authenticated users', async () => {
    mockGetSession.mockResolvedValue({ user: { id: '123' } });
    
    render(<LoginPage />);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should handle Google sign in', async () => {
    mockGetSession.mockResolvedValue(null);
    mockSignIn.mockResolvedValue({ ok: true });
    
    render(<LoginPage />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(signInButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        redirect: false,
        callbackUrl: '/',
      });
    });
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('should handle sign in error', async () => {
    mockGetSession.mockResolvedValue(null);
    mockSignIn.mockResolvedValue({ error: 'Sign in failed' });
    
    render(<LoginPage />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(signInButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to sign in with Google. Please try again.')).toBeInTheDocument();
    });
  });

  it('should show loading state during sign in', async () => {
    mockGetSession.mockResolvedValue(null);
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));
    
    render(<LoginPage />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(signInButton);
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(signInButton).toBeDisabled();
  });

  it('should handle unexpected errors', async () => {
    mockGetSession.mockResolvedValue(null);
    mockSignIn.mockRejectedValue(new Error('Network error'));
    
    render(<LoginPage />);
    
    const signInButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(signInButton);
    
    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });
});
