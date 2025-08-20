/**
 * Authentication Module Type Definitions
 */

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  expires: Date;
  token: string;
}

export interface AuthConfig {
  secret: string;
  jwtSecret: string;
  sessionMaxAge: number;
  adminEmails: string[];
  resendApiKey: string;
  resendFromEmail: string;
  baseUrl: string;
}

export interface MagicLinkPayload {
  email: string;
  token: string;
  expires: Date;
  callbackUrl?: string;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  name?: string;
  role?: 'admin' | 'user';
  iat: number;
  exp: number;
}

export interface SignInOptions {
  email: string;
  callbackUrl?: string;
  redirect?: boolean;
}

export interface VerifyTokenResult {
  valid: boolean;
  user?: User;
  error?: string;
}