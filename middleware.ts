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
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Allow GET requests to API routes for fabrics and blog (public data)
  if (method === 'GET' && (pathname.startsWith('/api/fabrics') || pathname.startsWith('/api/blog'))) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
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

  return NextResponse.next();
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
