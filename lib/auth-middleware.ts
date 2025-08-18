/**
 * Authentication Middleware for API Routes
 * Protects endpoints and validates user roles
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  return !!session?.user;
}

/**
 * Check if user is admin
 */
export async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === 'admin';
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Middleware to protect API routes
 */
export async function withAuth(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: { requireAdmin?: boolean } = {}
) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Authentication required',
            code: 'UNAUTHORIZED'
          } 
        },
        { status: 401 }
      );
    }
    
    // Check if admin role is required
    if (options.requireAdmin && session.user.role !== 'admin') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Admin access required',
            code: 'FORBIDDEN'
          } 
        },
        { status: 403 }
      );
    }
    
    // Add user to request
    (req as any).user = session.user;
    
    // Call the handler
    return handler(req);
  };
}

/**
 * Extract and validate API key from request
 */
export function getApiKey(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer') return null;
  
  return token;
}

/**
 * Validate API key for machine-to-machine auth
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  // TODO: Implement API key validation against database
  // For now, check against environment variable
  const validApiKey = process.env.API_SECRET_KEY;
  return apiKey === validApiKey;
}