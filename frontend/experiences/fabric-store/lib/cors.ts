import { NextRequest, NextResponse } from 'next/server'

// CORS configuration
const CORS_OPTIONS = {
  'Access-Control-Allow-Origin': '*', // Configure this based on your needs
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Max-Age': '86400', // 24 hours
}

// Custom CORS origins (add your allowed domains)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3006', 
  'http://localhost:3007',
  'http://localhost:9000',
  'https://tara-hub.vercel.app',
  'https://medusa-backend-production-3655.up.railway.app',
  'https://your-domain.com' // Add your production domains
]

export function corsHeaders(origin?: string | null) {
  const headers: Record<string, string> = { ...CORS_OPTIONS }
  
  // If specific origins are configured, check them
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  } else if (process.env.NODE_ENV === 'development') {
    // Allow all origins in development
    headers['Access-Control-Allow-Origin'] = origin || '*'
  }
  
  return headers
}

export function handleCors(request: Request) {
  const origin = request.headers.get('origin')
  return corsHeaders(origin)
}

// Handle preflight OPTIONS requests
export function corsResponse(request: Request, response?: NextResponse) {
  const corsHeadersObj = handleCors(request)
  
  if (response) {
    // Add CORS headers to existing response
    Object.entries(corsHeadersObj).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  } else {
    // Return preflight response
    return new NextResponse(null, {
      status: 200,
      headers: corsHeadersObj,
    })
  }
}

// Utility wrapper for API handlers
export function withCors(handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (request: NextRequest, ...args: any[]) => {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return corsResponse(request)
    }
    
    // Execute the handler
    const response = await handler(request, ...args)
    
    // Add CORS headers to the response
    return corsResponse(request, response)
  }
}