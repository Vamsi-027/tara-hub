import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Handle CORS for API routes
  if (path.startsWith('/api/')) {
    // Skip auth check for NextAuth API routes
    if (path.startsWith('/api/auth/')) {
      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
            'Access-Control-Max-Age': '86400',
          },
        })
      }
      return NextResponse.next()
    }

    // Handle preflight requests for other API routes
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    // Add CORS headers to API responses
    const response = NextResponse.next()
    
    // Get origin from request
    const origin = request.headers.get('origin')
    
    // Allow specific origins or all in development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3006',
      'http://localhost:3007', 
      'http://localhost:9000',
      'https://tara-hub.vercel.app'
    ]
    
    if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development')) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    return response
  }

  // Authentication checks for pages
  const publicPaths = ['/auth/signin', '/auth/error', '/browse', '/fabric', '/products', '/', '/hero-debug', '/simple-test', '/test-carousel', '/cors-test', '/sanity-test']
  const isPublicPath = publicPaths.some(p => path === p || path.startsWith(p + '/'))

  // Check if user is authenticated
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET 
  })

  // Protected paths that require authentication
  const protectedPaths = ['/checkout', '/cart', '/wishlist', '/admin', '/order-success']
  const isProtectedPath = protectedPaths.some(p => path === p || path.startsWith(p + '/'))

  // If accessing protected path without auth, redirect to signin
  if (isProtectedPath && !token) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(url)
  }

  // If authenticated and trying to access signin, redirect to browse
  if (path === '/auth/signin' && token) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/browse'
    return NextResponse.redirect(new URL(callbackUrl, request.url))
  }

  // Allow root path to show home page (removed redirect to /browse)

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}