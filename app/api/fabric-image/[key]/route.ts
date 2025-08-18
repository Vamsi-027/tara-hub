/**
 * FABRIC IMAGE SERVING API ENDPOINT
 * Serves images from R2 storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { R2StorageV3 } from '@/lib/r2-client-v3';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = decodeURIComponent(params.key);
    
    // Get the image from R2
    const result = await R2StorageV3.get(key);
    
    if (!result.success || !result.body) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }
    
    // Determine content type from the key extension
    let contentType = 'image/jpeg';
    if (key.endsWith('.png')) contentType = 'image/png';
    else if (key.endsWith('.webp')) contentType = 'image/webp';
    else if (key.endsWith('.gif')) contentType = 'image/gif';
    
    // Return the image with proper headers
    return new NextResponse(result.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Content-Length': result.contentLength?.toString() || '',
      },
    });
    
  } catch (error: any) {
    console.error('Error serving fabric image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}