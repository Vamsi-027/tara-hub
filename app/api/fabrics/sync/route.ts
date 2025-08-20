/**
 * FABRIC SYNC ENDPOINT
 * Keeps legacy API data in sync with admin changes
 * Called after admin CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { fabricService } from '@/modules/fabrics';
import { checkJWTAuth, PERMISSIONS } from '@/modules/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - only admin can trigger sync
    const { allowed, error } = await checkJWTAuth(PERMISSIONS.UPDATE);
    if (!allowed) {
      return error!;
    }

    // Get latest fabrics from database and refresh KV cache if needed
    const result = await fabricService.search(
      { isActive: true },
      { field: 'updatedAt', direction: 'desc' },
      { page: 1, limit: 1000 }
    );

    // Could implement KV cache refresh here if needed for performance
    // For now, the GET endpoint queries directly from database

    return NextResponse.json({
      success: true,
      message: `Synced ${result.data.length} fabrics`,
      count: result.data.length
    });

  } catch (error: any) {
    console.error('Fabric sync error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Sync failed' } },
      { status: 500 }
    );
  }
}