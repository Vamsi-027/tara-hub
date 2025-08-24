/**
 * FABRIC IMAGE UPLOAD API ENDPOINT
 * Handles image upload to Cloudflare R2 for fabric images
 */

import { NextRequest, NextResponse } from 'next/server';
import { getR2Client } from '@/src/core/storage/r2/client';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/src/core/database/drizzle/client';
import { fabricService } from '@/src/modules/fabrics';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface UploadResult {
  url: string;
  key: string;
  filename: string;
  size: number;
  type: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication using our custom auth system
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: { message: 'Unauthorized. Please log in.' } },
        { status: 401 }
      );
    }
    
    // Verify the JWT token
    let user;
    try {
      user = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
    } catch (error) {
      return NextResponse.json(
        { error: { message: 'Invalid or expired token.' } },
        { status: 401 }
      );
    }
    
    // Check if user has admin role
    if (!['admin', 'platform_admin', 'tenant_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: { message: 'Unauthorized. Admin access required.' } },
        { status: 403 }
      );
    }

    // Get fabric ID from query params if provided
    const searchParams = request.nextUrl.searchParams;
    const fabricId = searchParams.get('fabricId');

    // Check if R2 is configured
    const r2Client = getR2Client();
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
      return NextResponse.json(
        { 
          error: { 
            message: 'R2 storage not configured. Please set up R2 environment variables.',
            details: 'Missing R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_BUCKET_NAME'
          } 
        },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: { message: 'No files provided' } },
        { status: 400 }
      );
    }

    // Validate each file
    const validationErrors: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type || !ALLOWED_TYPES.includes(file.type)) {
        validationErrors.push(`File ${i + 1}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`);
      }
      
      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(`File ${i + 1}: File too large. Maximum size is 10MB.`);
      }
      
      if (!file.name) {
        validationErrors.push(`File ${i + 1}: File must have a name.`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: { message: 'File validation failed', details: validationErrors } },
        { status: 400 }
      );
    }

    // Upload files
    const uploadResults: UploadResult[] = [];
    const uploadErrors: string[] = [];
    const dbImageRecords: any[] = [];
    const uploadedKeys: string[] = []; // Track uploaded files for cleanup if needed

    // Process uploads
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Generate unique filename
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const uniqueId = nanoid(12);
        const timestamp = Date.now();
        const key = `fabrics/${fabricId ? `${fabricId}/` : ''}${timestamp}-${uniqueId}.${fileExtension}`;

        // Convert file to buffer
        const buffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);

        // Upload to R2
        const publicUrl = await r2Client.uploadImage(Buffer.from(uint8Array), key, file.type);

        uploadedKeys.push(key); // Track for potential cleanup

          // Store metadata in database if fabric ID is provided
          if (fabricId) {
            try {
              // Update fabric with the new image URL
              const currentFabric = await fabricService.findById(fabricId);
              if (currentFabric) {
                const currentImages = currentFabric.images || [];
                currentImages.push(publicUrl);
                await fabricService.update(fabricId, { images: currentImages }, user.id);
              }
            } catch (dbError: any) {
              console.error('Failed to store image metadata in database:', dbError);
              // Don't fail the whole upload if DB insert fails
              // The image is still uploaded to R2
              uploadErrors.push(`File ${i + 1} (${file.name}): Uploaded but failed to store metadata - ${dbError.message}`);
            }
          }

          uploadResults.push({
            url: publicUrl,
            key: key,
            filename: file.name,
            size: file.size,
            type: file.type
          });
      } catch (error: any) {
        console.error('Upload error for file:', file.name, error);
        uploadErrors.push(`File ${i + 1} (${file.name}): ${error.message}`);
        
        // If this is a critical error and we have a fabric ID, consider cleaning up
        if (fabricId && uploadResults.length === 0 && i === 0) {
          // First file failed, might want to stop
          break;
        }
      }
    }

    // Return results
    const response = {
      success: uploadResults.length > 0,
      uploads: uploadResults,
      errors: uploadErrors,
      summary: {
        total: files.length,
        successful: uploadResults.length,
        failed: uploadErrors.length
      }
    };

    if (uploadErrors.length > 0 && uploadResults.length === 0) {
      return NextResponse.json(
        { error: { message: 'All uploads failed', details: uploadErrors } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: response });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: { message: error.message || 'Upload failed' } },
      { status: 500 }
    );
  }
}

// GET endpoint to test R2 configuration
export async function GET() {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isConfigured = !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
    
    return NextResponse.json({
      configured: isConfigured,
      config: {
        endpoint: process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : null,
        bucket: process.env.R2_BUCKET_NAME || null,
        hasCredentials: !!(process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}