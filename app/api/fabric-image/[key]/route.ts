/**
 * FABRIC IMAGE SERVING API ENDPOINT
 * Serves images from R2 storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { R2StorageV3 } from '@/core/storage/r2/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key: paramKey } = await params;
    const key = decodeURIComponent(paramKey);
    
    // Get the image from R2
    const result = await R2StorageV3.get(key);
    
    if (!result.success || !result.body) {
      console.warn(`R2 image not found: ${key}`, result.error);
      return NextResponse.json(
        { error: 'Image not found', key, details: result.error },
        { status: 404 }
      );
    }
    
    // Determine content type from R2 response or key extension
    let contentType = result.contentType || 'image/jpeg';
    
    // Fallback to extension-based detection if R2 doesn't provide content type
    if (!result.contentType) {
      if (key.endsWith('.png')) contentType = 'image/png';
      else if (key.endsWith('.webp')) contentType = 'image/webp';
      else if (key.endsWith('.gif')) contentType = 'image/gif';
      else if (key.endsWith('.jpg') || key.endsWith('.jpeg')) contentType = 'image/jpeg';
    }
    
    // Return the image with proper headers
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
    };
    
    // Add content length if available
    if (result.contentLength) {
      headers['Content-Length'] = result.contentLength.toString();
    }
    
    // Add ETag for better caching if available
    if (result.etag) {
      headers['ETag'] = result.etag;
    }
    
    // Add last modified if available
    if (result.lastModified) {
      headers['Last-Modified'] = result.lastModified.toUTCString();
    }
    
    return new NextResponse(result.body, {
      status: 200,
      headers,
    });
    
  } catch (error: any) {
    console.error('Error serving fabric image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}