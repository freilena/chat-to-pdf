/**
 * Tests for Next.js Middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next-auth/jwt
const mockGetToken = vi.fn();
vi.mock('next-auth/jwt', () => ({
  getToken: mockGetToken,
}));

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ type: 'next' })),
    redirect: vi.fn((url) => ({ type: 'redirect', url })),
  },
  NextRequest: class NextRequest {
    constructor(public url: string) {}
    get nextUrl() {
      return {
        pathname: new URL(this.url).pathname,
      };
    }
  },
}));

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXTAUTH_SECRET = 'test-secret';
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
