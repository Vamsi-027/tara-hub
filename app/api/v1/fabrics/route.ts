/**
 * FABRICS API ROUTE
 * Next.js App Router API endpoints
 * Handles GET (list/search) and POST (create) operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fabricService } from '@/lib/services/fabric.service';
import { z } from 'zod';

// ============================================
// REQUEST/RESPONSE HELPERS
// ============================================

/**
 * Standard API response format
 */
function apiResponse(
  data: any,
  status: number = 200,
  meta?: any
): NextResponse {
  return NextResponse.json(
    {
      success: status < 400,
      data,
      meta,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Error response format
 */
function errorResponse(
  message: string,
  status: number = 400,
  errors?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        details: errors,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Check if user has required permission
 */
async function checkPermission(
  permission: 'read' | 'create' | 'update' | 'delete'
): Promise<{ allowed: boolean; userId?: string; error?: NextResponse }> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return {
      allowed: false,
      error: errorResponse('Authentication required', 401),
    };
  }
  
  const userRole = (session.user as any)?.role;
  const userId = (session.user as any)?.id;
  
  // Permission matrix
  const permissions = {
    read: ['viewer', 'editor', 'admin', 'tenant_admin', 'platform_admin'],
    create: ['editor', 'admin', 'tenant_admin', 'platform_admin'],
    update: ['editor', 'admin', 'tenant_admin', 'platform_admin'],
    delete: ['admin', 'tenant_admin', 'platform_admin'],
  };
  
  if (!permissions[permission].includes(userRole)) {
    return {
      allowed: false,
      error: errorResponse('Insufficient permissions', 403),
    };
  }
  
  return { allowed: true, userId };
}

// ============================================
// GET /api/v1/fabrics
// List and search fabrics
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Check read permission (optional for public API)
    // const { allowed, error } = await checkPermission('read');
    // if (!allowed) return error!;
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    
    // Special endpoints
    const special = searchParams.get('special');
    if (special) {
      switch (special) {
        case 'featured':
          const featuredLimit = parseInt(searchParams.get('limit') || '12');
          const featured = await fabricService.getFeatured(featuredLimit);
          return apiResponse(featured);
          
        case 'new-arrivals':
          const newLimit = parseInt(searchParams.get('limit') || '12');
          const newArrivals = await fabricService.getNewArrivals(newLimit);
          return apiResponse(newArrivals);
          
        case 'best-sellers':
          const bestLimit = parseInt(searchParams.get('limit') || '12');
          const bestSellers = await fabricService.getBestSellers(bestLimit);
          return apiResponse(bestSellers);
          
        case 'low-stock':
          const threshold = searchParams.get('threshold') 
            ? parseInt(searchParams.get('threshold')!)
            : undefined;
          const lowStock = await fabricService.getLowStock(threshold);
          return apiResponse(lowStock);
          
        case 'filter-options':
          const options = await fabricService.getFilterOptions();
          return apiResponse(options);
          
        case 'statistics':
          const stats = await fabricService.getStatistics();
          return apiResponse(stats);
          
        default:
          return errorResponse('Invalid special endpoint');
      }
    }
    
    // Build filter object from query params
    const filter: any = {};
    
    // Text search
    if (searchParams.has('search')) {
      filter.search = searchParams.get('search');
    }
    
    // Type filter (comma-separated)
    if (searchParams.has('type')) {
      filter.type = searchParams.get('type')!.split(',');
    }
    
    // Status filter
    if (searchParams.has('status')) {
      filter.status = searchParams.get('status')!.split(',');
    }
    
    // Manufacturer filter
    if (searchParams.has('manufacturer')) {
      filter.manufacturer = searchParams.get('manufacturer')!.split(',');
    }
    
    // Collection filter
    if (searchParams.has('collection')) {
      filter.collection = searchParams.get('collection')!.split(',');
    }
    
    // Price range
    if (searchParams.has('priceMin')) {
      filter.priceMin = parseFloat(searchParams.get('priceMin')!);
    }
    if (searchParams.has('priceMax')) {
      filter.priceMax = parseFloat(searchParams.get('priceMax')!);
    }
    
    // Stock filters
    if (searchParams.has('inStock')) {
      filter.inStock = searchParams.get('inStock') === 'true';
    }
    if (searchParams.has('minStock')) {
      filter.minStock = parseInt(searchParams.get('minStock')!);
    }
    
    // Feature filters
    if (searchParams.has('isFeatured')) {
      filter.isFeatured = searchParams.get('isFeatured') === 'true';
    }
    if (searchParams.has('isNewArrival')) {
      filter.isNewArrival = searchParams.get('isNewArrival') === 'true';
    }
    if (searchParams.has('isBestSeller')) {
      filter.isBestSeller = searchParams.get('isBestSeller') === 'true';
    }
    
    // Tags filter
    if (searchParams.has('tags')) {
      filter.tags = searchParams.get('tags')!.split(',');
    }
    
    // Date filters
    if (searchParams.has('createdAfter')) {
      filter.createdAfter = searchParams.get('createdAfter');
    }
    if (searchParams.has('createdBefore')) {
      filter.createdBefore = searchParams.get('createdBefore');
    }
    
    // Sort parameters
    const sort = {
      field: searchParams.get('sortBy') || 'createdAt',
      direction: searchParams.get('sortDirection') || 'desc',
    };
    
    // Pagination parameters
    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };
    
    // Validate limit
    if (pagination.limit > 100) {
      return errorResponse('Limit cannot exceed 100');
    }
    
    // Perform search
    const result = await fabricService.search(filter, sort, pagination);
    
    // Add response headers for pagination
    const response = apiResponse(result.data, 200, {
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious,
      },
    });
    
    // Add cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    
    return response;
    
  } catch (error: any) {
    console.error('GET /api/v1/fabrics error:', error);
    
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid request parameters', 400, error.errors);
    }
    
    return errorResponse(
      error.message || 'Failed to fetch fabrics',
      500
    );
  }
}

// ============================================
// POST /api/v1/fabrics
// Create new fabric
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Check authentication and create permission
    const session = await getServerSession(authOptions);
    if (!session) {
      return errorResponse('Authentication required', 401);
    }
    
    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return errorResponse('Admin access required', 403);
    }
    
    const userId = (session.user as any)?.id || session.user?.email;
    
    // Parse request body
    const body = await request.json();
    
    // Create fabric
    const fabric = await fabricService.create(body, userId!);
    
    // Return created fabric
    return apiResponse(fabric, 201);
    
  } catch (error: any) {
    console.error('POST /api/v1/fabrics error:', error);
    
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.errors);
    }
    
    if (error.message?.includes('already exists')) {
      return errorResponse(error.message, 409); // Conflict
    }
    
    return errorResponse(
      error.message || 'Failed to create fabric',
      500
    );
  }
}

// ============================================
// OPTIONS /api/v1/fabrics
// CORS preflight
// ============================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
