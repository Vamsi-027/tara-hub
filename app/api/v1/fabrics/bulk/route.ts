/**
 * FABRIC BULK OPERATIONS API ROUTE
 * Handles bulk create, update, and delete operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fabricService } from '@/lib/services/fabric.service';
import { z } from 'zod';

// ============================================
// HELPERS
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
  permission: 'create' | 'update' | 'delete'
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
  
  const permissions = {
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
// Validation Schemas
// ============================================

const bulkCreateSchema = z.object({
  operation: z.literal('create'),
  items: z.array(z.object({
    // Define fabric creation schema
    sku: z.string(),
    name: z.string(),
    // ... other required fields
  })).min(1).max(100), // Limit to 100 items per request
});

const bulkUpdateSchema = z.object({
  operation: z.literal('update'),
  items: z.array(z.object({
    id: z.string().uuid(),
    data: z.object({
      // Define update fields
    }).partial(),
  })).min(1).max(100),
});

const bulkDeleteSchema = z.object({
  operation: z.literal('delete'),
  ids: z.array(z.string().uuid()).min(1).max(100),
});

// ============================================
// POST /api/v1/fabrics/bulk
// Bulk operations endpoint
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Determine operation type
    const operation = body.operation;
    
    if (!operation) {
      return errorResponse('Operation type is required');
    }
    
    switch (operation) {
      // ========================================
      // BULK CREATE
      // ========================================
      case 'create': {
        const { allowed, userId, error } = await checkPermission('create');
        if (!allowed) return error!;
        
        // Validate request
        const validated = bulkCreateSchema.parse(body);
        
        // Perform bulk create
        const result = await fabricService.bulkCreate(validated.items, userId!);
        
        // Return results
        return apiResponse({
          operation: 'create',
          total: validated.items.length,
          success: result.success.length,
          failed: result.failed.length,
          results: {
            success: result.success,
            failed: result.failed,
          },
        }, result.failed.length > 0 ? 207 : 201); // 207 Multi-Status if partial success
      }
      
      // ========================================
      // BULK UPDATE
      // ========================================
      case 'update': {
        const { allowed, userId, error } = await checkPermission('update');
        if (!allowed) return error!;
        
        // Validate request
        const validated = bulkUpdateSchema.parse(body);
        
        // Perform bulk update
        const result = await fabricService.bulkUpdate(validated.items, userId!);
        
        // Return results
        return apiResponse({
          operation: 'update',
          total: validated.items.length,
          success: result.success.length,
          failed: result.failed.length,
          results: {
            success: result.success,
            failed: result.failed,
          },
        }, result.failed.length > 0 ? 207 : 200);
      }
      
      // ========================================
      // BULK DELETE
      // ========================================
      case 'delete': {
        const { allowed, userId, error } = await checkPermission('delete');
        if (!allowed) return error!;
        
        // Validate request
        const validated = bulkDeleteSchema.parse(body);
        
        // Perform bulk delete
        const result = await fabricService.bulkDelete(validated.ids, userId!);
        
        // Return results
        return apiResponse({
          operation: 'delete',
          total: validated.ids.length,
          success: result.success,
          failed: result.failed.length,
          results: {
            deleted: result.success,
            failed: result.failed,
          },
        }, result.failed.length > 0 ? 207 : 200);
      }
      
      // ========================================
      // BULK STOCK UPDATE
      // ========================================
      case 'updateStock': {
        const { allowed, userId, error } = await checkPermission('update');
        if (!allowed) return error!;
        
        const items = body.items as Array<{
          id: string;
          quantity: number;
          type: 'add' | 'remove' | 'set';
          notes?: string;
        }>;
        
        if (!items || !Array.isArray(items)) {
          return errorResponse('Items array is required');
        }
        
        if (items.length > 100) {
          return errorResponse('Maximum 100 items per request');
        }
        
        const results = {
          success: [] as any[],
          failed: [] as any[],
        };
        
        for (const item of items) {
          try {
            const updated = await fabricService.updateStock(
              item.id,
              item.quantity,
              item.type,
              undefined,
              item.notes,
              userId
            );
            
            if (updated) {
              results.success.push({
                id: item.id,
                stockQuantity: updated.stockQuantity,
                availableQuantity: updated.availableQuantity,
              });
            }
          } catch (error: any) {
            results.failed.push({
              id: item.id,
              error: error.message,
            });
          }
        }
        
        return apiResponse({
          operation: 'updateStock',
          total: items.length,
          success: results.success.length,
          failed: results.failed.length,
          results,
        }, results.failed.length > 0 ? 207 : 200);
      }
      
      // ========================================
      // BULK PRICE UPDATE
      // ========================================
      case 'updatePricing': {
        const { allowed, userId, error } = await checkPermission('update');
        if (!allowed) return error!;
        
        const items = body.items as Array<{
          id: string;
          retailPrice: number;
          wholesalePrice?: number;
          reason?: string;
          effectiveDate?: string;
        }>;
        
        if (!items || !Array.isArray(items)) {
          return errorResponse('Items array is required');
        }
        
        if (items.length > 100) {
          return errorResponse('Maximum 100 items per request');
        }
        
        const results = {
          success: [] as any[],
          failed: [] as any[],
        };
        
        for (const item of items) {
          try {
            const updated = await fabricService.updatePricing(
              item.id,
              item.retailPrice,
              item.wholesalePrice,
              item.reason,
              item.effectiveDate ? new Date(item.effectiveDate) : undefined,
              userId
            );
            
            if (updated) {
              results.success.push({
                id: item.id,
                retailPrice: updated.retailPrice,
                wholesalePrice: updated.wholesalePrice,
              });
            }
          } catch (error: any) {
            results.failed.push({
              id: item.id,
              error: error.message,
            });
          }
        }
        
        return apiResponse({
          operation: 'updatePricing',
          total: items.length,
          success: results.success.length,
          failed: results.failed.length,
          results,
        }, results.failed.length > 0 ? 207 : 200);
      }
      
      default:
        return errorResponse(`Unknown operation: ${operation}`, 400);
    }
    
  } catch (error: any) {
    console.error('POST /api/v1/fabrics/bulk error:', error);
    
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.errors);
    }
    
    return errorResponse(
      error.message || 'Bulk operation failed',
      500
    );
  }
}

// ============================================
// OPTIONS /api/v1/fabrics/bulk
// CORS preflight
// ============================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
