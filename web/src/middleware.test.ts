/**
 * Tests for Next.js Middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next-auth/middleware
const mockWithAuth = vi.fn();
vi.mock('next-auth/middleware', () => ({
  withAuth: mockWithAuth,
}));

// Mock NextResponse
const mockNextResponse = {
  next: vi.fn(() => ({ type: 'next' })),
  redirect: vi.fn((url) => ({ type: 'redirect', url })),
};

vi.mock('next/server', () => ({
  NextResponse: mockNextResponse,
}));

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be configured with withAuth', async () => {
    // Import the middleware to trigger the withAuth call
    await import('./middleware');
    
    expect(mockWithAuth).toHaveBeenCalled();
  });

  it('should have correct matcher configuration', async () => {
    const middleware = await import('./middleware');
    
    // The config should be exported
    expect(middleware.config).toBeDefined();
    expect(middleware.config.matcher).toBeDefined();
    expect(Array.isArray(middleware.config.matcher)).toBe(true);
  });

  it('should match the expected paths', async () => {
    const middleware = await import('./middleware');
    const matcher = middleware.config.matcher[0];
    
    // Should match all paths except static files and public folder
    expect(matcher).toBe('/((?!_next/static|_next/image|favicon.ico|public/).*)');
  });
});
