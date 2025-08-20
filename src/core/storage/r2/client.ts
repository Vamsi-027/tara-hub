/**
 * Unified Cloudflare R2 Storage Client
 * Consolidates r2-client.ts, r2-client-v2.ts, r2-client-v3.ts into a single implementation
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export class R2StorageClient {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(config: R2Config) {
    this.bucketName = config.bucketName;
    this.publicUrl = `https://${config.accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload an image to R2
   */
  async uploadImage(file: Buffer, key: string, contentType: string = 'image/jpeg'): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.client.send(command);
    return `${this.publicUrl}/${this.bucketName}/${key}`;
  }

  /**
   * Upload multiple images
   */
  async uploadImages(files: Array<{ buffer: Buffer; key: string; contentType?: string }>): Promise<string[]> {
    const uploads = files.map(file => 
      this.uploadImage(file.buffer, file.key, file.contentType)
    );
    return Promise.all(uploads);
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