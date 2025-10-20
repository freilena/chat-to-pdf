import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VersionBadge from './VersionBadge';

describe('VersionBadge', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set NODE_ENV to development for tests
    vi.stubEnv('NODE_ENV', 'development');
  });

  it('should not render in production mode', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const { container } = render(<VersionBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('should fetch version info from API on mount', async () => {
    const mockVersionData = {
      version: '0.1.0-dev',
      git_branch: 'feature/test',
      git_commit: 'abc1234',
      git_commit_full: 'abc1234567890abcdef1234567890abcdef123456',
      git_commit_date: '2025-10-20T12:00:00Z',
      git_uncommitted_changes: false,
      environment: 'development',
    };

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(mockVersionData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    (globalThis as any).fetch = fetchMock;

    render(<VersionBadge />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/version');
    });
  });

  it('should display short version info when loaded', async () => {
    const mockVersionData = {
      version: '0.1.0-dev',
      git_branch: 'main',
      git_commit: 'abc1234',
      git_commit_full: 'abc1234567890abcdef1234567890abcdef123456',
      git_commit_date: '2025-10-20T12:00:00Z',
      git_uncommitted_changes: false,
      environment: 'development',
    };

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(mockVersionData), { status: 200 })
    );
    (globalThis as any).fetch = fetchMock;

    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText(/v0.1.0-dev/)).toBeInTheDocument();
      expect(screen.getByText(/main@abc1234/)).toBeInTheDocument();
    });
  });

  it('should show uncommitted changes indicator with asterisk', async () => {
    const mockVersionData = {
      version: '0.1.0-dev',
      git_branch: 'main',
      git_commit: 'abc1234',
      git_commit_full: 'abc1234567890abcdef1234567890abcdef123456',
      git_commit_date: '2025-10-20T12:00:00Z',
      git_uncommitted_changes: true,
      environment: 'development',
    };

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(mockVersionData), { status: 200 })
    );
    (globalThis as any).fetch = fetchMock;

    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText(/main@abc1234\*/)).toBeInTheDocument();
    });
  });

  it('should expand details when clicked', async () => {
    const mockVersionData = {
      version: '0.1.0-dev',
      git_branch: 'main',
      git_commit: 'abc1234',
      git_commit_full: 'abc1234567890abcdef1234567890abcdef123456',
      git_commit_date: '2025-10-20T12:00:00Z',
      git_uncommitted_changes: false,
      environment: 'development',
    };

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(mockVersionData), { status: 200 })
    );
    (globalThis as any).fetch = fetchMock;

    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText(/v0.1.0-dev/)).toBeInTheDocument();
    });

    // Initially, detailed fields should not be visible
    expect(screen.queryByText(/Version:/)).not.toBeInTheDocument();

    // Click to expand
    const badge = screen.getByText(/v0.1.0-dev/).closest('div');
    if (badge) {
      fireEvent.click(badge);
    }

    // Now detailed fields should be visible
    await waitFor(() => {
      expect(screen.getByText(/Version:/)).toBeInTheDocument();
      expect(screen.getByText(/Branch:/)).toBeInTheDocument();
      expect(screen.getByText(/Commit:/)).toBeInTheDocument();
      expect(screen.getByText(/Environment:/)).toBeInTheDocument();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('Network error'));
    (globalThis as any).fetch = fetchMock;

    const { container } = render(<VersionBadge />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    // Component should not render anything if fetch fails
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch version info:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should not render if version data is missing', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response('null', { status: 200 })
    );
    (globalThis as any).fetch = fetchMock;

    const { container } = render(<VersionBadge />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    // Component should not render if no version data
    expect(container.firstChild).toBeNull();
  });

  it('should show clean status when no uncommitted changes', async () => {
    const mockVersionData = {
      version: '0.1.0-dev',
      git_branch: 'main',
      git_commit: 'abc1234',
      git_commit_full: 'abc1234567890abcdef1234567890abcdef123456',
      git_commit_date: '2025-10-20T12:00:00Z',
      git_uncommitted_changes: false,
      environment: 'development',
    };

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(mockVersionData), { status: 200 })
    );
    (globalThis as any).fetch = fetchMock;

    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText(/v0.1.0-dev/)).toBeInTheDocument();
    });

    // Click to expand
    const badge = screen.getByText(/v0.1.0-dev/).closest('div');
    if (badge) {
      fireEvent.click(badge);
    }

    // Should show clean status
    await waitFor(() => {
      expect(screen.getByText(/✓ Clean/)).toBeInTheDocument();
    });
  });

  it('should show uncommitted changes warning when changes exist', async () => {
    const mockVersionData = {
      version: '0.1.0-dev',
      git_branch: 'main',
      git_commit: 'abc1234',
      git_commit_full: 'abc1234567890abcdef1234567890abcdef123456',
      git_commit_date: '2025-10-20T12:00:00Z',
      git_uncommitted_changes: true,
      environment: 'development',
    };

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(mockVersionData), { status: 200 })
    );
    (globalThis as any).fetch = fetchMock;

    render(<VersionBadge />);

    await waitFor(() => {
      expect(screen.getByText(/v0.1.0-dev/)).toBeInTheDocument();
    });

    // Click to expand
    const badge = screen.getByText(/v0.1.0-dev/).closest('div');
    if (badge) {
      fireEvent.click(badge);
    }

    // Should show uncommitted changes warning
    await waitFor(() => {
      expect(screen.getByText(/⚠️ Uncommitted changes/)).toBeInTheDocument();
    });
  });
});

