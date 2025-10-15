/**
 * OAuth Configuration for Chat to Your PDF
 * 
 * This module handles OAuth provider configuration for Google and Apple authentication.
 * All secrets are loaded from environment variables for security.
 */

export interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
  };
  apple: {
    clientId: string;
    clientSecret: string;
  };
  nextAuth: {
    secret: string;
    url: string;
  };
}

export interface SessionConfig {
  cookieName: string;
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

/**
 * Loads and validates OAuth configuration from environment variables
 * @returns Validated OAuth configuration
 * @throws Error if required environment variables are missing
 */
export function loadOAuthConfig(): OAuthConfig {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'APPLE_CLIENT_ID',
    'APPLE_CLIENT_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    },
    nextAuth: {
      secret: process.env.NEXTAUTH_SECRET!,
      url: process.env.NEXTAUTH_URL!,
    },
  };
}

/**
 * Session configuration for secure cookie management
 */
export const sessionConfig: SessionConfig = {
  cookieName: 'chat-to-pdf-session',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict',
};

/**
 * Validates that all required OAuth configuration is present
 * @param config OAuth configuration to validate
 * @returns true if valid, false otherwise
 */
export function validateOAuthConfig(config: OAuthConfig): boolean {
  return !!(
    config.google.clientId &&
    config.google.clientSecret &&
    config.apple.clientId &&
    config.apple.clientSecret &&
    config.nextAuth.secret &&
    config.nextAuth.url
  );
}

/**
 * Gets the OAuth configuration, loading from environment variables
 * @returns OAuth configuration
 */
export function getOAuthConfig(): OAuthConfig {
  return loadOAuthConfig();
}
