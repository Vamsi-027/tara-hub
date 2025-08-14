import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Define protected routes and their required roles
const protectedRoutes = {
  '/admin': ['admin'],
  '/api/posts': ['admin'],
  '/api/products': ['admin'],
  '/api/strategy': ['admin'],
  '/api/fabrics': ['admin'],
  '/api/blog': ['admin'],
  '/api/etsy-products': ['admin'],
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/fabrics',
  '/fabric',
  '/blog',
  '/auth/signin',
  '/auth/verify-request',
  '/api/auth',
  '/api/test-email',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get the token (session)
  const token = await getToken({ 
    req: request as any,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if route requires authentication
  const protectedRoute = Object.entries(protectedRoutes).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (protectedRoute) {
    // No token means not authenticated
    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check role-based access
    const [, requiredRoles] = protectedRoute;
    const userRole = (token as any).role || 'user';

    if (!requiredRoles.includes(userRole)) {
      // User is authenticated but doesn't have the required role
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
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