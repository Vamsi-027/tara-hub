/**
 * Authentication Middleware
 * Interface layer - handles request authentication and authorization
 * Single Responsibility: HTTP request authentication and role-based authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { HttpStatusCode } from '../../shared/constants/http-status.constants';
import { createErrorResponse } from '../../shared/utils/api-response.util';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

export class AuthMiddleware {
  private readonly jwtSecret: string;
  private readonly adminEmails: Set<string>;

  constructor(jwtSecret: string, adminEmails: string[] = []) {
    this.jwtSecret = jwtSecret;
    this.adminEmails = new Set(adminEmails);
  }

  authenticate() {
    return async (request: AuthenticatedRequest): Promise<NextResponse | null> => {
      try {
        const token = this.extractToken(request);
        
        if (!token) {
          return createErrorResponse(
            'Authentication required',
            HttpStatusCode.UNAUTHORIZED
          );
        }

        const payload = await this.verifyToken(token);
        
        if (!payload) {
          return createErrorResponse(
            'Invalid or expired token',
            HttpStatusCode.UNAUTHORIZED
          );
        }

        request.user = {
          id: payload.sub as string,
          email: payload.email as string,
          role: payload.role as string || 'user',
          isAdmin: this.adminEmails.has(payload.email as string)
        };

        return null;
      } catch (error) {
        return createErrorResponse(
          'Authentication failed',
          HttpStatusCode.UNAUTHORIZED
        );
      }
    };
  }

  requireAdmin() {
    return async (request: AuthenticatedRequest): Promise<NextResponse | null> => {
      const authResult = await this.authenticate()(request);
      if (authResult) return authResult;

      if (!request.user?.isAdmin) {
        return createErrorResponse(
          'Admin access required',
          HttpStatusCode.FORBIDDEN
        );
      }

      return null;
    };
  }

  requireRole(requiredRole: string) {
    return async (request: AuthenticatedRequest): Promise<NextResponse | null> => {
      const authResult = await this.authenticate()(request);
      if (authResult) return authResult;

      if (request.user?.role !== requiredRole && !request.user?.isAdmin) {
        return createErrorResponse(
          `Role '${requiredRole}' required`,
          HttpStatusCode.FORBIDDEN
        );
      }

      return null;
    };
  }

  optional() {
    return async (request: AuthenticatedRequest): Promise<NextResponse | null> => {
      try {
        const token = this.extractToken(request);
        
        if (token) {
          const payload = await this.verifyToken(token);
          
          if (payload) {
            request.user = {
              id: payload.sub as string,
              email: payload.email as string,
              role: payload.role as string || 'user',
              isAdmin: this.adminEmails.has(payload.email as string)
            };
          }
        }

        return null;
      } catch (error) {
        return null;
      }
    };
  }

  private extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      if (tokenMatch) {
        return tokenMatch[1];
      }
    }

    return null;
  }

  private async verifyToken(token: string): Promise<any | null> {
    try {
      return verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }
}

export function createAuthMiddleware(jwtSecret?: string, adminEmails: string[] = []): AuthMiddleware {
  const secret = jwtSecret || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  
  if (!secret) {
    throw new Error('JWT secret is required for authentication middleware');
  }

  const defaultAdminEmails = [
    'varaku@gmail.com',
    'batchu.kedareswaraabhinav@gmail.com',
    'vamsicheruku027@gmail.com',
    'admin@deepcrm.ai'
  ];

  return new AuthMiddleware(secret, [...defaultAdminEmails, ...adminEmails]);
}