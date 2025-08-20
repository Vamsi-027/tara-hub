/**
 * JWT Authentication utilities for API routes
 */
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export interface AuthResult {
  allowed: boolean;
  userId?: string;
  userRole?: string;
  userEmail?: string;
  error?: NextResponse;
}

/**
 * Check JWT authentication and permissions
 */
export async function checkJWTAuth(
  requiredRoles?: string[]
): Promise<AuthResult> {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return {
        allowed: false,
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      };
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    if (!decoded || !decoded.email) {
      return {
        allowed: false,
        error: NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        )
      };
    }
    
    const userRole = decoded.role;
    const userId = decoded.userId || decoded.email;
    const userEmail = decoded.email;
    
    // Check role permissions if specified
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(userRole)) {
        return {
          allowed: false,
          error: NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          )
        };
      }
    }
    
    return {
      allowed: true,
      userId,
      userRole,
      userEmail
    };
    
  } catch (error) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    };
  }
}

/**
 * Standard permission roles
 */
export const PERMISSIONS = {
  READ: ['viewer', 'editor', 'admin', 'tenant_admin', 'platform_admin'],
  CREATE: ['editor', 'admin', 'tenant_admin', 'platform_admin'],
  UPDATE: ['editor', 'admin', 'tenant_admin', 'platform_admin'],
  DELETE: ['admin', 'tenant_admin', 'platform_admin'],
  ADMIN_ONLY: ['admin', 'tenant_admin', 'platform_admin']
} as const;