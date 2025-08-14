/**
 * Auth Service Interface
 * Abstraction layer for authentication that can work with different backends
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'admin' | 'user';
}

export interface Session {
  user: User;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthCredentials {
  email?: string;
  password?: string;
  provider?: 'email' | 'google' | 'credentials';
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: Session;
  error?: string;
  requiresVerification?: boolean;
}

export interface IAuthService {
  // Core authentication methods
  signIn(credentials: AuthCredentials): Promise<AuthResponse>;
  signOut(): Promise<void>;
  signUp?(credentials: AuthCredentials): Promise<AuthResponse>;
  
  // Session management
  getSession(): Promise<Session | null>;
  refreshSession?(): Promise<Session | null>;
  
  // Token management
  verifyToken?(token: string): Promise<User | null>;
  generateTokens?(user: User): Promise<{ accessToken: string; refreshToken: string }>;
  
  // User management
  getCurrentUser(): Promise<User | null>;
  updateUser?(id: string, data: Partial<User>): Promise<User>;
  
  // Role management
  hasRole(role: string): Promise<boolean>;
  isAdmin(): Promise<boolean>;
  
  // Email verification
  sendVerificationEmail?(email: string): Promise<void>;
  verifyEmail?(token: string): Promise<AuthResponse>;
}