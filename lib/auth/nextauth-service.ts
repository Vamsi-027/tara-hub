/**
 * NextAuth Implementation of Auth Service
 * Current implementation using NextAuth.js
 */

import { signIn, signOut, getSession } from "next-auth/react";
import { IAuthService, User, Session, AuthCredentials, AuthResponse } from "./auth-service.interface";

export class NextAuthService implements IAuthService {
  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      let result;
      
      if (credentials.provider === 'google') {
        result = await signIn('google', { 
          redirect: false,
          callbackUrl: '/admin' 
        });
      } else if (credentials.email) {
        result = await signIn('email', { 
          email: credentials.email,
          redirect: false,
          callbackUrl: '/admin'
        });
      } else {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      if (result?.error) {
        return {
          success: false,
          error: result.error
        };
      }

      if (result?.url && credentials.provider === 'email') {
        // Email sign in - requires verification
        return {
          success: true,
          requiresVerification: true
        };
      }

      // Get the session after successful sign in
      const session = await this.getSession();
      if (session) {
        return {
          success: true,
          session,
          user: session.user
        };
      }

      return {
        success: false,
        error: 'Failed to establish session'
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  }

  async signOut(): Promise<void> {
    await signOut({ callbackUrl: '/' });
  }

  async getSession(): Promise<Session | null> {
    const session = await getSession();
    if (!session) return null;

    return {
      user: {
        id: (session.user as any)?.id || '',
        email: session.user?.email || '',
        name: session.user?.name || undefined,
        image: session.user?.image || undefined,
        role: (session.user as any)?.role || 'user'
      },
      accessToken: (session as any)?.accessToken,
      expiresAt: (session as any)?.expires ? 
        new Date((session as any).expires).getTime() : undefined
    };
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user || null;
  }

  async hasRole(role: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === role;
  }

  async isAdmin(): Promise<boolean> {
    return this.hasRole('admin');
  }

  async sendVerificationEmail(email: string): Promise<void> {
    // NextAuth handles this automatically with the Email provider
    await signIn('email', { 
      email, 
      redirect: false 
    });
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    // NextAuth handles email verification automatically
    // This would be handled by the NextAuth callback URL
    return {
      success: true,
      requiresVerification: false
    };
  }
}

// Export singleton instance
export const authService = new NextAuthService();