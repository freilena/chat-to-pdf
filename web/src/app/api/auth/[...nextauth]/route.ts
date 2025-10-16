/**
 * Auth.js API Route Handler
 * 
 * Handles OAuth authentication flows for Google and Apple providers.
 * Creates secure sessions and manages authentication state.
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getOAuthConfig } from '@/lib/auth/config';
import { createSessionData, generateSessionToken, hashSessionToken } from '@/lib/auth/session';

// Get OAuth configuration with error handling
let oauthConfig;
try {
  oauthConfig = getOAuthConfig();
} catch (error) {
  console.error('Failed to load OAuth configuration:', error);
  // In development, provide fallback configuration
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    oauthConfig = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '123456789012345678901.apps.googleusercontent.com',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'GOCSPX-1234567890abcdefghijklmnopqrstuvwxyz',
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID || 'com.yourcompany.chattopdf',
        clientSecret: process.env.APPLE_CLIENT_SECRET || 'abcdefghijklmnopqrstuvwxyz1234567890',
      },
      nextAuth: {
        secret: process.env.NEXTAUTH_SECRET || 'abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890',
        url: process.env.NEXTAUTH_URL || 'http://localhost:3001',
      },
    };
  } else {
    throw error;
  }
}

const handler = NextAuth({
  providers: [
    Google({
      clientId: oauthConfig.google.clientId,
      clientSecret: oauthConfig.google.clientSecret,
      // Add development mode configuration
      allowDangerousEmailAccountLinking: process.env.NODE_ENV === 'development',
    }),
  ],
  secret: oauthConfig.nextAuth.secret,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Allow sign in for Google provider
      if (account?.provider === 'google') {
        return true;
      }
      return false;
    },
    async session({ session, token }) {
      // Add session_id to the session object
      if (token?.sessionId) {
        session.sessionId = token.sessionId as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Generate session data on first sign in
      if (user && account) {
        const sessionData = createSessionData(user.id, account.provider as 'google' | 'apple');
        const sessionToken = generateSessionToken();
        
        // Store session data in token
        token.sessionId = sessionData.sessionId;
        token.userId = sessionData.userId;
        token.provider = sessionData.provider;
        token.createdAt = sessionData.createdAt;
        token.lastActivity = sessionData.lastActivity;
        token.sessionToken = hashSessionToken(sessionToken.token);
        token.sessionExpires = sessionToken.expiresAt;
      }
      
      return token;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: 'chat-to-pdf-session',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      },
    },
  },
});

export { handler as GET, handler as POST };
