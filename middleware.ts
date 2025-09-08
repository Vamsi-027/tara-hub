import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from '@tsndr/cloudflare-worker-jwt';

// Define protected routes and their required roles
const protectedRoutes = {
  '/admin': ['admin'],
  '/api/posts': ['admin'],
  '/api/products': ['admin'],
  '/api/strategy': ['admin'],
  '/api/etsy-products': ['admin'],
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/fabrics',
  '/fabric',
  '/blog',
  '/auth/signin',
  '/auth/verify',
  '/auth/success',
  '/auth/error',
  '/auth/verify-request',
  '/api/auth',
  '/api/test-email',
  '/api/fabrics',  // GET requests to fabrics API should be public
  '/api/blog',      // GET requests to blog API should be public
  '/api/commerce',  // Commerce API for fabric-store
];

async function resolveTenant(hostname: string): Promise<string> {
  // Remove port if present
  const domain = hostname.split(':')[0];
  
  // For local development
  if (domain.includes('localhost')) {
    const port = hostname.split(':')[1];
    if (port === '3006') return 'fabric-store';
    if (port === '3007') return 'store-guide';
    return 'default';
  }
  
  // For production, resolve based on subdomain or domain
  const parts = domain.split('.');
  if (parts.length > 2) {
    return parts[0]; // subdomain
  }
  
  return 'default';
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const hostname = request.headers.get('host') || '';

  // Resolve tenant and add to headers
  const tenantId = await resolveTenant(hostname);
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenantId);

  // Allow GET requests to API routes for fabrics and blog (public data)
  if (method === 'GET' && (pathname.startsWith('/api/fabrics') || pathname.startsWith('/api/blog') || pathname.startsWith('/api/commerce'))) {
    response.headers.set('x-tenant-id', tenantId);
    return response;
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    response.headers.set('x-tenant-id', tenantId);
    return response;
  }

  // Check if route requires authentication
  const protectedRoute = Object.entries(protectedRoutes).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (protectedRoute) {
    const authCookie = request.cookies.get('auth-token');
    let isValid = false;

    try {
      if (authCookie?.value) {
        isValid = await jwt.verify(
          authCookie.value,
          process.env.NEXTAUTH_SECRET || ''
        );
        console.log('✅ Auth token verification result:', isValid);
      }
    } catch (error) {
      console.log('❌ Error verifying auth token in middleware:', error);
    }

    if (!isValid) {
      console.log('❌ Invalid or expired token, redirecting to signin');
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    console.log('✅ Valid token found, allowing access to protected route');
    // For Edge Runtime compatibility, we'll rely on the session API for role verification
    // The admin panel components will handle role-based access control
  }

  response.headers.set('x-tenant-id', tenantId);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
