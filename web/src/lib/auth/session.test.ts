/**
 * Tests for Session Management Utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateSessionToken,
  generateSessionId,
  hashSessionToken,
  validateTokenFormat,
  validateSessionIdFormat,
  createSessionData,
  updateSessionActivity,
  isSessionExpired,
  getSecureCookieOptions,
  type SessionData
} from './session';

describe('Session Management', () => {
  describe('generateSessionToken', () => {
    it('should generate a token with correct format', () => {
      const tokenData = generateSessionToken();
      
      expect(tokenData.token).toMatch(/^[a-f0-9]{64}$/);
      expect(tokenData.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should generate unique tokens', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      
      expect(token1.token).not.toBe(token2.token);
    });

    it('should set expiration time correctly', () => {
      const tokenData = generateSessionToken();
      const expectedExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
      const tolerance = 1000; // 1 second tolerance
      
      expect(Math.abs(tokenData.expiresAt - expectedExpiry)).toBeLessThan(tolerance);
    });
  });

  describe('generateSessionId', () => {
    it('should generate a valid UUID v4', () => {
      const sessionId = generateSessionId();
      
      expect(validateSessionIdFormat(sessionId)).toBe(true);
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      
      expect(id1).not.toBe(id2);
    });

    it('should have correct UUID v4 format', () => {
      const sessionId = generateSessionId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(uuidRegex.test(sessionId)).toBe(true);
    });
  });

  describe('hashSessionToken', () => {
    it('should generate a hash for a token', () => {
      const token = 'test-token-123';
      const hash = hashSessionToken(token);
      
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate consistent hashes for the same token', () => {
      const token = 'test-token-123';
      const hash1 = hashSessionToken(token);
      const hash2 = hashSessionToken(token);
      
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different tokens', () => {
      const token1 = 'test-token-123';
      const token2 = 'test-token-456';
      const hash1 = hashSessionToken(token1);
      const hash2 = hashSessionToken(token2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validateTokenFormat', () => {
    it('should return true for valid token format', () => {
      const validToken = 'a'.repeat(64);
      expect(validateTokenFormat(validToken)).toBe(true);
    });

    it('should return false for invalid token format', () => {
      const invalidTokens = [
        'short',
        'a'.repeat(63), // Too short
        'a'.repeat(65), // Too long
        'g'.repeat(64), // Invalid character
        '123', // Too short
        '', // Empty
      ];

      invalidTokens.forEach(token => {
        expect(validateTokenFormat(token)).toBe(false);
      });
    });
  });

  describe('validateSessionIdFormat', () => {
    it('should return true for valid UUID v4 format', () => {
      const validUuids = [
        '123e4567-e89b-42d3-a456-426614174000', // Fixed: 4 in position 13
        '550e8400-e29b-41d4-a716-446655440000', // Fixed: 4 in position 13
        '6ba7b810-9dad-41d1-80b4-00c04fd430c8', // Fixed: 4 in position 13
      ];

      validUuids.forEach(uuid => {
        expect(validateSessionIdFormat(uuid)).toBe(true);
      });
    });

    it('should return false for invalid UUID format', () => {
      const invalidUuids = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-42661417400', // Too short
        '123e4567-e89b-12d3-a456-4266141740000', // Too long
        '123e4567-e89b-12d3-a456-42661417400g', // Invalid character
        '123e4567-e89b-12d3-a456', // Missing parts
        '', // Empty
      ];

      invalidUuids.forEach(uuid => {
        expect(validateSessionIdFormat(uuid)).toBe(false);
      });
    });
  });

  describe('createSessionData', () => {
    it('should create session data with correct structure', () => {
      const sessionData = createSessionData('user123', 'google');
      
      expect(sessionData.userId).toBe('user123');
      expect(sessionData.provider).toBe('google');
      expect(sessionData.sessionId).toBeDefined();
      expect(sessionData.createdAt).toBeDefined();
      expect(sessionData.lastActivity).toBeDefined();
      expect(validateSessionIdFormat(sessionData.sessionId)).toBe(true);
    });

    it('should set timestamps correctly', () => {
      const before = Date.now();
      const sessionData = createSessionData('user123', 'apple');
      const after = Date.now();
      
      expect(sessionData.createdAt).toBeGreaterThanOrEqual(before);
      expect(sessionData.createdAt).toBeLessThanOrEqual(after);
      expect(sessionData.lastActivity).toBe(sessionData.createdAt);
    });

    it('should work with different providers', () => {
      const googleSession = createSessionData('user123', 'google');
      const appleSession = createSessionData('user456', 'apple');
      
      expect(googleSession.provider).toBe('google');
      expect(appleSession.provider).toBe('apple');
    });
  });

  describe('updateSessionActivity', () => {
    it('should update lastActivity timestamp', () => {
      const sessionData = createSessionData('user123', 'google');
      const originalActivity = sessionData.lastActivity;
      
      // Wait a small amount to ensure timestamp difference
      setTimeout(() => {
        const updatedSession = updateSessionActivity(sessionData);
        expect(updatedSession.lastActivity).toBeGreaterThan(originalActivity);
      }, 1);
    });

    it('should preserve other session data', () => {
      const sessionData = createSessionData('user123', 'google');
      const updatedSession = updateSessionActivity(sessionData);
      
      expect(updatedSession.sessionId).toBe(sessionData.sessionId);
      expect(updatedSession.userId).toBe(sessionData.userId);
      expect(updatedSession.provider).toBe(sessionData.provider);
      expect(updatedSession.createdAt).toBe(sessionData.createdAt);
    });
  });

  describe('isSessionExpired', () => {
    it('should return false for recent session', () => {
      const sessionData = createSessionData('user123', 'google');
      expect(isSessionExpired(sessionData)).toBe(false);
    });

    it('should return true for expired session', () => {
      const sessionData: SessionData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user123',
        provider: 'google',
        createdAt: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
        lastActivity: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
      };
      
      expect(isSessionExpired(sessionData)).toBe(true);
    });

    it('should return false for session within expiry time', () => {
      const sessionData: SessionData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        userId: 'user123',
        provider: 'google',
        createdAt: Date.now() - (6 * 24 * 60 * 60 * 1000), // 6 days ago
        lastActivity: Date.now() - (6 * 24 * 60 * 60 * 1000), // 6 days ago
      };
      
      expect(isSessionExpired(sessionData)).toBe(false);
    });
  });

  describe('getSecureCookieOptions', () => {
    it('should return correct cookie options', () => {
      const options = getSecureCookieOptions();
      
      expect(options.name).toBe('chat-to-pdf-session');
      expect(options.maxAge).toBe(60 * 60 * 24 * 7); // 7 days
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe('strict');
      expect(options.path).toBe('/');
    });

    it('should set secure based on environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test development
      process.env.NODE_ENV = 'development';
      vi.resetModules();
      const devModule = await import('./session');
      expect(devModule.getSecureCookieOptions().secure).toBe(false);
      
      // Test production
      process.env.NODE_ENV = 'production';
      vi.resetModules();
      const prodModule = await import('./session');
      expect(prodModule.getSecureCookieOptions().secure).toBe(true);
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});
