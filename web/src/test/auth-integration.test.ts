/**
 * Authentication Integration Tests
 * 
 * Tests that would have caught the environment variable issue
 */

import { describe, it, expect } from 'vitest';

describe('Authentication Integration', () => {
  describe('OAuth Configuration Loading', () => {
    it('should fail when environment variables are missing', async () => {
      const originalEnv = process.env;
      
      // Clear all auth-related environment variables
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.APPLE_CLIENT_ID;
      delete process.env.APPLE_CLIENT_SECRET;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXTAUTH_URL;

      try {
        // This should throw when trying to load the config
        await expect(async () => {
          const { loadOAuthConfig } = await import('../lib/auth/config');
          loadOAuthConfig();
        }).rejects.toThrow('Missing required environment variables');
      } finally {
        process.env = originalEnv;
      }
    });

    it('should work when environment variables are present', async () => {
      const originalEnv = process.env;
      
      // Set all required environment variables
      process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
      process.env.APPLE_CLIENT_ID = 'test-apple-client-id';
      process.env.APPLE_CLIENT_SECRET = 'test-apple-client-secret';
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      try {
        // This should not throw
        const { loadOAuthConfig } = await import('../lib/auth/config');
        const config = loadOAuthConfig();
        expect(config.google.clientId).toBe('test-google-client-id');
        expect(config.apple.clientId).toBe('test-apple-client-id');
        expect(config.nextAuth.secret).toBe('test-nextauth-secret');
      } finally {
        process.env = originalEnv;
      }
    });
  });
});
