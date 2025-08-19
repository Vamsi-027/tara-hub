/**
 * FABRIC BY ID API ROUTE
 * Next.js App Router API endpoint for individual fabric operations
 * Handles GET (read), PUT (update), DELETE operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/custom-auth';
import { fabricService } from '@/lib/services/fabric.service';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { checkJWTAuth } from '@/lib/auth-utils-jwt';

// ============================================
// HELPERS (reuse from main route)
// ============================================

function apiResponse(data: any, status: number = 200, meta?: any): NextResponse {
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

async function checkPermission(
  permission: 'read' | 'create' | 'update' | 'delete'
): Promise<{ allowed: boolean; userId?: string; error?: NextResponse }> {
  try {
    // Get JWT token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return {
        allowed: false,
        error: errorResponse('Authentication required', 401)
      };
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    
    if (!decoded || !decoded.email) {
      return {
        allowed: false,
        error: errorResponse('Invalid token', 401),
      };
    }
    
    const userRole = decoded.role;
    const userId = decoded.userId;
  
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
  } catch (error) {
    return {
      allowed: false,
      error: errorResponse('Authentication failed', 401),
    };
  }
}

// ============================================
// GET /api/v1/fabrics/[id]
// Get fabric by ID, SKU, or slug
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if ID is a UUID, SKU, or slug
    let fabric;
    
    // UUID pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // SKU pattern (uppercase with hyphens)
    const skuPattern = /^[A-Z0-9-]+$/;
    
    if (uuidPattern.test(id)) {
      // It's a UUID
      fabric = await fabricService.getById(id);
    } else if (skuPattern.test(id)) {
      // It's a SKU
      fabric = await fabricService.getBySku(id);
    } else {
      // Assume it's a slug
      fabric = await fabricService.getBySlug(id);
    }
    
    if (!fabric) {
      return errorResponse('Fabric not found', 404);
    }
    
    // Check for related data requests
    const searchParams = request.nextUrl.searchParams;
    const include = searchParams.get('include')?.split(',') || [];
    
    const responseData: any = { ...fabric };
    
    // Include related data if requested
    if (include.includes('related')) {
      responseData.related = await fabricService.getRelated(fabric.id, 6);
    }
    
    if (include.includes('priceHistory')) {
      responseData.priceHistory = await fabricService.getPriceHistory(fabric.id, 10);
    }
    
    if (include.includes('stockHistory')) {
      responseData.stockHistory = await fabricService.getStockHistory(fabric.id, 20);
    }
    
    const response = apiResponse(responseData);
    
    // Add cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    response.headers.set('ETag', `"${fabric.id}-${fabric.version}"`);
    
    return response;
    
  } catch (error: any) {
    console.error('GET /api/v1/fabrics/[id] error:', error);
    return errorResponse(
      error.message || 'Failed to fetch fabric',
      500
    );
  }
}

// ============================================
// PUT /api/v1/fabrics/[id]
// Update fabric
// ============================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check update permission
    const { allowed, userId, error } = await checkPermission('update');
    if (!allowed) return error!;
    
    const { id } = await params;
    
    // Validate UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      return errorResponse('Invalid fabric ID format', 400);
    }
    
    // Parse request body
    const body = await request.json();
    
    // Check for special operations
    if (body.operation) {
      switch (body.operation) {
        case 'updateStock':
          const stockResult = await fabricService.updateStock(
            id,
            body.quantity,
            body.type || 'adjustment',
            body.reference,
            body.notes,
            userId
          );
          
          if (!stockResult) {
            return errorResponse('Failed to update stock', 400);
          }
          
          return apiResponse(stockResult);
          
        case 'updatePricing':
          const priceResult = await fabricService.updatePricing(
            id,
            body.retailPrice,
            body.wholesalePrice,
            body.reason,
            body.effectiveDate ? new Date(body.effectiveDate) : undefined,
            userId
          );
          
          if (!priceResult) {
            return errorResponse('Failed to update pricing', 400);
          }
          
          return apiResponse(priceResult);
          
        default:
          return errorResponse('Invalid operation', 400);
      }
    }
    
    // Regular update
    const fabric = await fabricService.update(id, body, userId!);
    
    if (!fabric) {
      return errorResponse('Fabric not found', 404);
    }
    
    return apiResponse(fabric);
    
  } catch (error: any) {
    console.error('PUT /api/v1/fabrics/[id] error:', error);
    
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.errors);
    }
    
    if (error.message?.includes('Concurrent modification')) {
      return errorResponse(
        'The fabric has been modified by another user. Please refresh and try again.',
        409
      );
    }
    
    if (error.message?.includes('already exists')) {
      return errorResponse(error.message, 409);
    }
    
    return errorResponse(
      error.message || 'Failed to update fabric',
      500
    );
  }
}

// ============================================
// DELETE /api/v1/fabrics/[id]
// Delete fabric (soft delete)
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check delete permission
    const { allowed, userId, error } = await checkPermission('delete');
    if (!allowed) return error!;
    
    const { id } = await params;
    
    // Validate UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      return errorResponse('Invalid fabric ID format', 400);
    }
    
    // Check for permanent delete flag (requires platform_admin)
    const searchParams = request.nextUrl.searchParams;
    const permanent = searchParams.get('permanent') === 'true';
    
    if (permanent) {
      const { allowed: isPlatformAdmin, error: authError } = await checkJWTAuth(['platform_admin']);
      if (!isPlatformAdmin) {
        return errorResponse('Only platform admins can permanently delete fabrics', 403);
      }
      
      // Implement hard delete if needed
      return errorResponse('Permanent deletion not implemented', 501);
    }
    
    // Perform soft delete
    const deleted = await fabricService.delete(id, userId!);
    
    if (!deleted) {
      return errorResponse('Fabric not found', 404);
    }
    
    return apiResponse({ id, deleted: true }, 200);
    
  } catch (error: any) {
    console.error('DELETE /api/v1/fabrics/[id] error:', error);
    return errorResponse(
      error.message || 'Failed to delete fabric',
      500
    );
  }
}

// ============================================
// PATCH /api/v1/fabrics/[id]
// Partial update fabric
// ============================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // PATCH is just an alias for PUT in this implementation
  return PUT(request, { params });
}

// ============================================
// OPTIONS /api/v1/fabrics/[id]
// CORS preflight
// ============================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
