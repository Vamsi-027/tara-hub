/**
 * Unified Cloudflare R2 Storage Client
 * Enhanced version with retry logic, better error handling, and performance optimizations
 */

import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string; // Optional CDN URL
  maxRetries?: number;
  region?: string;
}

export interface UploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface BatchUploadFile {
  buffer: Buffer;
  key: string;
  options?: UploadOptions;
}

export class R2StorageClient {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;
  private cdnUrl?: string;
  private maxRetries: number;

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;
    this.publicUrl = `https://${config.accountId}.r2.cloudflarestorage.com`;
    this.cdnUrl = config.publicUrl;
    this.maxRetries = config.maxRetries || 3;

    // Enhanced S3 client configuration with connection pooling
    this.client = new S3Client({
      region: config.region || 'auto',
      endpoint: this.publicUrl,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      maxAttempts: this.maxRetries,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 5000,
        socketTimeout: 60000,
      }),
    });
  }

  /**
   * Execute operation with exponential backoff retry
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.$metadata?.httpStatusCode && error.$metadata.httpStatusCode >= 400 && error.$metadata.httpStatusCode < 500) {
          throw error;
        }
        
        // Exponential backoff: 1s, 2s, 4s...
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Upload an image to R2 with enhanced options
   */
  async uploadImage(
    file: Buffer, 
    key: string, 
    options: UploadOptions = {}
  ): Promise<string> {
    const { 
      contentType = 'image/jpeg',
      cacheControl = 'public, max-age=31536000, immutable',
      metadata = {}
    } = options;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: metadata,
    });

    await this.executeWithRetry(() => this.client.send(command));
    
    // Return CDN URL if configured, otherwise R2 URL
    return this.getPublicUrl(key);
  }

  /**
   * Upload multiple images with parallel execution and error resilience
   */
  async uploadImages(files: BatchUploadFile[]): Promise<Array<{ success: boolean; url?: string; error?: string; key: string }>> {
    const results = await Promise.allSettled(
      files.map(file => 
        this.uploadImage(file.buffer, file.key, file.options).then(url => ({ 
          success: true as const, 
          url, 
          key: file.key 
        }))
      )
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          key: files[index].key,
          error: result.reason?.message || 'Upload failed',
        };
      }
    });
  }

  /**
   * Delete an image from R2
   */
  async deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Delete multiple images
   */
  async deleteImages(keys: string[]): Promise<void> {
    const deletions = keys.map(key => this.deleteImage(key));
    await Promise.all(deletions);
  }

  /**
   * Get a signed URL for temporary access
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Check if an object exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a unique key for an image
   */
  generateImageKey(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = filename.split('.').pop();
    return `${prefix}/${timestamp}-${random}.${extension}`;
  }
}

// Singleton instance
let instance: R2StorageClient | null = null;

export function getR2Client(): R2StorageClient {
  if (!instance) {
    const config: R2Config = {
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: process.env.R2_BUCKET_NAME!,
    };
    instance = new R2StorageClient(config);
  }
  return instance;
}