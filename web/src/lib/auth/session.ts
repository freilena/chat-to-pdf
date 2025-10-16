/**
 * Session Management Utilities for Chat to Your PDF
 * 
 * This module handles secure session token generation, validation, and cookie management.
 * All session operations use cryptographically secure methods.
 */

import { randomBytes, createHash } from 'crypto';
import { sessionConfig } from './config';

export interface SessionData {
  sessionId: string;
  userId: string;
  provider: 'google' | 'apple';
  createdAt: number;
  lastActivity: number;
}

export interface SessionToken {
  token: string;
  expiresAt: number;
}

/**
 * Generates a cryptographically secure session token
 * @returns Session token with expiration
 */
export function generateSessionToken(): SessionToken {
  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (sessionConfig.maxAge * 1000);
  
  return {
    token,
    expiresAt,
  };
}

/**
 * Generates a unique session ID using UUID v4 format
 * @returns Unique session identifier
 */
export function generateSessionId(): string {
  // Generate 16 random bytes
  const bytes = randomBytes(16);
  
  // Set version (4) and variant bits according to UUID v4 spec
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
  
  // Convert to UUID string format
  const hex = bytes.toString('hex');
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32)
  ].join('-');
}

/**
 * Creates a hash of the session token for secure storage
 * @param token Plain text session token
 * @returns Hashed token
 */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Validates a session token format
 * @param token Token to validate
 * @returns true if token format is valid
 */
export function validateTokenFormat(token: string): boolean {
  // Session tokens should be 64 character hex strings
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * Validates a session ID format (UUID v4)
 * @param sessionId Session ID to validate
 * @returns true if session ID format is valid
 */
export function validateSessionIdFormat(sessionId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

/**
 * Creates session data object
 * @param userId User identifier from OAuth provider
 * @param provider OAuth provider used for authentication
 * @returns Complete session data
 */
export function createSessionData(userId: string, provider: 'google' | 'apple'): SessionData {
  const now = Date.now();
  
  return {
    sessionId: generateSessionId(),
    userId,
    provider,
    createdAt: now,
    lastActivity: now,
  };
}

/**
 * Updates the last activity timestamp for a session
 * @param sessionData Existing session data
 * @returns Updated session data
 */
export function updateSessionActivity(sessionData: SessionData): SessionData {
  return {
    ...sessionData,
    lastActivity: Date.now(),
  };
}

/**
 * Checks if a session has expired
 * @param sessionData Session data to check
 * @returns true if session has expired
 */
export function isSessionExpired(sessionData: SessionData): boolean {
  const now = Date.now();
  const maxAge = sessionConfig.maxAge * 1000;
  
  return (now - sessionData.lastActivity) > maxAge;
}

/**
 * Gets secure cookie options for session storage
 * @returns Cookie options object
 */
export function getSecureCookieOptions() {
  return {
    name: sessionConfig.cookieName,
    maxAge: sessionConfig.maxAge,
    secure: sessionConfig.secure,
    httpOnly: sessionConfig.httpOnly,
    sameSite: sessionConfig.sameSite,
    path: '/',
  };
}

