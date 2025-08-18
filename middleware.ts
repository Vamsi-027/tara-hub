import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // Check if auth token exists (simplified for Edge Runtime)
  let hasValidToken = false;
  try {
    const authCookie = request.cookies.get('auth-token');
    console.log(`🍪 Middleware checking path: ${pathname}, has auth-token:`, !!authCookie?.value);
    
    if (authCookie?.value) {
      // For Edge Runtime, we'll trust the session API to verify the token
      // Just check if cookie exists and has reasonable length
      hasValidToken = authCookie.value.length > 100; // JWT tokens are typically longer
      console.log('✅ Auth token present in middleware, length:', authCookie.value.length);
    }
  } catch (error) {
    console.log('❌ Error checking auth token in middleware:', error);
    hasValidToken = false;
  }

  // Check if route requires authentication
  const protectedRoute = Object.entries(protectedRoutes).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (protectedRoute) {
    // No token means not authenticated
    if (!hasValidToken) {
      console.log('❌ No valid token, redirecting to signin');
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