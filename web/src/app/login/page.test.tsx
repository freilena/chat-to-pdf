/**
 * Tests for Login Page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import LoginPage from './page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  getSession: vi.fn(),
}));

describe('LoginPage', () => {
  const mockPush = vi.fn();
  const mockSignIn = vi.fn();
  const mockGetSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
    (signIn as any).mockImplementation(mockSignIn);
    (getSession as any).mockImplementation(mockGetSession);
  });

  describe('Rendering', () => {
    it('should render login page with both Google and Apple buttons', () => {
      render(<LoginPage />);
      
      expect(screen.getByText('Sign in to Chat to Your PDF')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
      expect(screen.getByText('Sign in with Apple')).toBeInTheDocument();
    });

    it('should show development mode warning', () => {
      render(<LoginPage />);
      
      expect(screen.getByText('Development Mode:')).toBeInTheDocument();
      expect(screen.getByText(/OAuth credentials are currently set to placeholder values/)).toBeInTheDocument();
    });
  });

  describe('Google OAuth', () => {
    it('should handle Google sign in successfully', async () => {
      mockSignIn.mockResolvedValue({ ok: true });
      
      render(<LoginPage />);
      
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          redirect: false,
          callbackUrl: '/',
        });
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle Google sign in error', async () => {
      mockSignIn.mockResolvedValue({ error: 'OAuthCallback' });
      
      render(<LoginPage />);
      
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(googleButton);
      
      await waitFor(() => {
        expect(screen.getByText(/OAuth setup required/)).toBeInTheDocument();
      });
    });
  });

  describe('Apple OAuth', () => {
    it('should handle Apple sign in successfully', async () => {
      mockSignIn.mockResolvedValue({ ok: true });
      
      render(<LoginPage />);
      
      const appleButton = screen.getByRole('button', { name: /sign in with apple/i });
      fireEvent.click(appleButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('apple', {
          redirect: false,
          callbackUrl: '/',
        });
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('should handle Apple sign in error', async () => {
      mockSignIn.mockResolvedValue({ error: 'OAuthCallback' });
      
      render(<LoginPage />);
      
      const appleButton = screen.getByRole('button', { name: /sign in with apple/i });
      fireEvent.click(appleButton);
      
      await waitFor(() => {
        expect(screen.getByText(/OAuth setup required/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading states', () => {
    it('should show loading state during Google sign in', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));
      
      render(<LoginPage />);
      
      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      fireEvent.click(googleButton);
      
      expect(screen.getAllByText('Signing in...')).toHaveLength(2);
      expect(googleButton).toBeDisabled();
    });

    it('should show loading state during Apple sign in', async () => {
      mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));
      
      render(<LoginPage />);
      
      const appleButton = screen.getByRole('button', { name: /sign in with apple/i });
      fireEvent.click(appleButton);
      
      expect(screen.getAllByText('Signing in...')).toHaveLength(2);
      expect(appleButton).toBeDisabled();
    });
  });

  describe('Session check', () => {
    it('should redirect authenticated users', async () => {
      mockGetSession.mockResolvedValue({ user: { id: 'test-user' } });
      
      render(<LoginPage />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });
});