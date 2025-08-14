/**
 * NestJS/JWT Implementation of Auth Service
 * Future implementation for NestJS backend
 * This is a template for when you migrate to NestJS
 */

import { IAuthService, User, Session, AuthCredentials, AuthResponse } from "./auth-service.interface";
import { apiClient } from "@/lib/api/client";

export class NestJSAuthService implements IAuthService {
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly REFRESH_TOKEN_KEY = 'jwt_refresh_token';
  private readonly USER_KEY = 'user_data';

  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      let endpoint = '';
      let body: any = {};

      if (credentials.provider === 'google') {
        // Handle Google OAuth with NestJS
        endpoint = '/auth/google';
        body = { token: credentials.email }; // Google token
      } else if (credentials.email && credentials.password) {
        // Handle credentials-based auth
        endpoint = '/auth/signin';
        body = { email: credentials.email, password: credentials.password };
      } else if (credentials.email) {
        // Handle magic link
        endpoint = '/auth/signin/email';
        body = { email: credentials.email };
      } else {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const response = await apiClient.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>(endpoint, body);

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Sign in failed'
        };
      }

      // Store tokens and user data
      this.storeTokens(response.data.accessToken, response.data.refreshToken);
      this.storeUser(response.data.user);

      return {
        success: true,
        user: response.data.user,
        session: {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken
        }
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
    try {
      // Call backend to invalidate tokens
      await apiClient.post('/auth/signout');
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Clear local storage
      this.clearStorage();
      // Redirect to home
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }

  async signUp(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>('/auth/signup', {
        email: credentials.email,
        password: credentials.password
      });

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'Sign up failed'
        };
      }

      // Store tokens and user data
      this.storeTokens(response.data.accessToken, response.data.refreshToken);
      this.storeUser(response.data.user);

      return {
        success: true,
        user: response.data.user,
        session: {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken
        }
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign up failed'
      };
    }
  }

  async getSession(): Promise<Session | null> {
    const token = this.getStoredToken();
    const user = this.getStoredUser();

    if (!token || !user) {
      return null;
    }

    // Verify token is still valid
    try {
      const response = await apiClient.get<{ valid: boolean }>('/auth/verify');
      if (!response.success || !response.data?.valid) {
        // Try to refresh the session
        return this.refreshSession();
      }
    } catch {
      return this.refreshSession();
    }

    return {
      user,
      accessToken: token,
      refreshToken: this.getStoredRefreshToken() || undefined
    };
  }

  async refreshSession(): Promise<Session | null> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      this.clearStorage();
      return null;
    }

    try {
      const response = await apiClient.post<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>('/auth/refresh', { refreshToken });

      if (!response.success || !response.data) {
        this.clearStorage();
        return null;
      }

      // Update stored tokens
      this.storeTokens(response.data.accessToken, response.data.refreshToken);
      this.storeUser(response.data.user);

      return {
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken
      };
    } catch (error) {
      console.error('Session refresh error:', error);
      this.clearStorage();
      return null;
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const response = await apiClient.post<{ user: User }>('/auth/verify-token', { token });
      return response.success && response.data ? response.data.user : null;
    } catch {
      return null;
    }
  }

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    // This would typically be done on the backend
    throw new Error('Token generation should be done on the backend');
  }

  async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user || null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error('Failed to update user');
    }
    
    // Update stored user data
    this.storeUser(response.data);
    return response.data;
  }

  async hasRole(role: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === role;
  }

  async isAdmin(): Promise<boolean> {
    return this.hasRole('admin');
  }

  async sendVerificationEmail(email: string): Promise<void> {
    await apiClient.post('/auth/send-verification', { email });
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    const response = await apiClient.post<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>('/auth/verify-email', { token });

    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Email verification failed'
      };
    }

    // Store tokens and user data
    this.storeTokens(response.data.accessToken, response.data.refreshToken);
    this.storeUser(response.data.user);

    return {
      success: true,
      user: response.data.user,
      session: {
        user: response.data.user,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken
      }
    };
  }

  // Private helper methods
  private storeTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  private storeUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }
}

// Note: This will be instantiated when you migrate to NestJS
// export const authService = new NestJSAuthService();