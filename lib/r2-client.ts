import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize R2 client (Cloudflare R2 is S3-compatible)
const r2Client = new S3Client({
  region: 'auto', // R2 uses 'auto' region
  endpoint: process.env.S3_URL || process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim() || '',
  },
  // R2 specific settings
  forcePathStyle: false, // R2 uses virtual-hosted-style URLs
  signatureVersion: 'v4',
})

// Get bucket name from environment
const BUCKET_NAME = process.env.R2_BUCKET || 'store'

export class R2Storage {
  /**
   * Check if R2 is configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      (process.env.S3_URL || process.env.R2_ENDPOINT)
    )
  }

  /**
   * Upload a file to R2
   */
  static async upload(key: string, body: Buffer | Uint8Array | string, contentType?: string) {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType || 'application/octet-stream',
      })
      
      const result = await r2Client.send(command)
      return {
        success: true,
        key,
        etag: result.ETag,
        versionId: result.VersionId,
      }
    } catch (error) {
      console.error('R2 upload error:', error)
      throw error
    }
  }

  /**
   * Get a file from R2
   */
  static async get(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
      
      const result = await r2Client.send(command)
      const body = await result.Body?.transformToString()
      
      return {
        success: true,
        body,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
      }
    } catch (error) {
      console.error('R2 get error:', error)
      throw error
    }
  }

  /**
   * Delete a file from R2
   */
  static async delete(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
      
      const result = await r2Client.send(command)
      return {
        success: true,
        key,
        deleteMarker: result.DeleteMarker,
        versionId: result.VersionId,
      }
    } catch (error) {
      console.error('R2 delete error:', error)
      throw error
    }
  }

  /**
   * List files in R2 bucket
   */
  static async list(prefix?: string, maxKeys?: number) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: maxKeys || 100,
      })
      
      const result = await r2Client.send(command)
      return {
        success: true,
        files: result.Contents?.map(item => ({
          key: item.Key,
          size: item.Size,
          lastModified: item.LastModified,
          etag: item.ETag,
        })) || [],
        count: result.KeyCount,
        isTruncated: result.IsTruncated,
      }
    } catch (error) {
      console.error('R2 list error:', error)
      throw error
    }
  }

  /**
   * Generate a presigned URL for direct upload/download
   */
  static async getPresignedUrl(key: string, operation: 'get' | 'put' = 'get', expiresIn: number = 3600) {
    try {
      const command = operation === 'put' 
        ? new PutObjectCommand({ Bucket: BUCKET_NAME, Key: key })
        : new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
      
      const url = await getSignedUrl(r2Client, command, { expiresIn })
      return {
        success: true,
        url,
        expiresIn,
        operation,
      }
    } catch (error) {
      console.error('R2 presigned URL error:', error)
      throw error
    }
  }
}

export default R2Storage