/**
 * NextAuth.js API Route Handler
 * 
 * Handles OAuth authentication flows for Google and Apple providers.
 * Creates secure sessions and manages authentication state.
 */

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getOAuthConfig } from '@/lib/auth/config';
import { createSessionData, generateSessionToken, hashSessionToken } from '@/lib/auth/session';

// Get OAuth configuration
const oauthConfig = getOAuthConfig();

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: oauthConfig.google.clientId,
      clientSecret: oauthConfig.google.clientSecret,
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
