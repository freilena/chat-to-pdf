/**
 * Tests for OAuth Configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadOAuthConfig, validateOAuthConfig, getOAuthConfig, sessionConfig } from './config';

describe('OAuth Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('loadOAuthConfig', () => {
    it('should load configuration from environment variables', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
      process.env.APPLE_CLIENT_ID = 'test-apple-client-id';
      process.env.APPLE_CLIENT_SECRET = 'test-apple-client-secret';
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      const config = loadOAuthConfig();

      expect(config.google.clientId).toBe('test-google-client-id');
      expect(config.google.clientSecret).toBe('test-google-client-secret');
      expect(config.apple.clientId).toBe('test-apple-client-id');
      expect(config.apple.clientSecret).toBe('test-apple-client-secret');
      expect(config.nextAuth.secret).toBe('test-nextauth-secret');
      expect(config.nextAuth.url).toBe('http://localhost:3000');
    });

    it('should throw error when required environment variables are missing', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
      // Missing other required variables

      expect(() => loadOAuthConfig()).toThrow('Missing required environment variables');
    });

    it('should throw error with specific missing variables', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
      // Missing APPLE_CLIENT_ID, APPLE_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL

      expect(() => loadOAuthConfig()).toThrow('Missing required environment variables: APPLE_CLIENT_ID, APPLE_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL');
    });
  });

  describe('validateOAuthConfig', () => {
    it('should return true for valid configuration', () => {
      const config = {
        google: {
          clientId: 'test-google-client-id',
          clientSecret: 'test-google-client-secret',
        },
        apple: {
          clientId: 'test-apple-client-id',
          clientSecret: 'test-apple-client-secret',
        },
        nextAuth: {
          secret: 'test-nextauth-secret',
          url: 'http://localhost:3000',
        },
      };

      expect(validateOAuthConfig(config)).toBe(true);
    });

    it('should return false for configuration with missing values', () => {
      const config = {
        google: {
          clientId: 'test-google-client-id',
          clientSecret: '', // Empty string
        },
        apple: {
          clientId: 'test-apple-client-id',
          clientSecret: 'test-apple-client-secret',
        },
        nextAuth: {
          secret: 'test-nextauth-secret',
          url: 'http://localhost:3000',
        },
      };

      expect(validateOAuthConfig(config)).toBe(false);
    });

    it('should return false for configuration with undefined values', () => {
      const config = {
        google: {
          clientId: 'test-google-client-id',
          clientSecret: 'test-google-client-secret',
        },
        apple: {
          clientId: 'test-apple-client-id',
          clientSecret: 'test-apple-client-secret',
        },
        nextAuth: {
          secret: 'test-nextauth-secret',
          url: undefined as any, // Undefined value
        },
      };

      expect(validateOAuthConfig(config)).toBe(false);
    });
  });

  describe('getOAuthConfig', () => {
    it('should return configuration loaded from environment', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
      process.env.APPLE_CLIENT_ID = 'test-apple-client-id';
      process.env.APPLE_CLIENT_SECRET = 'test-apple-client-secret';
      process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
      process.env.NEXTAUTH_URL = 'http://localhost:3000';

      const config = getOAuthConfig();

      expect(config.google.clientId).toBe('test-google-client-id');
      expect(config.apple.clientId).toBe('test-apple-client-id');
    });
  });

  describe('sessionConfig', () => {
    it('should have correct default values', () => {
      expect(sessionConfig.cookieName).toBe('chat-to-pdf-session');
      expect(sessionConfig.maxAge).toBe(60 * 60 * 24 * 7); // 7 days
      expect(sessionConfig.httpOnly).toBe(true);
      expect(sessionConfig.sameSite).toBe('strict');
    });

    it('should set secure to true in production', async () => {
      process.env.NODE_ENV = 'production';
      
      // Re-import to get updated config
      vi.resetModules();
      const { sessionConfig: prodConfig } = await import('./config');
      
      expect(prodConfig.secure).toBe(true);
    });

    it('should set secure to false in development', async () => {
      process.env.NODE_ENV = 'development';
      
      // Re-import to get updated config
      vi.resetModules();
      const { sessionConfig: devConfig } = await import('./config');
      
      expect(devConfig.secure).toBe(false);
    });
  });
});
