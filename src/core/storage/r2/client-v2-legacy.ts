import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Extract account ID from S3 URL
const extractAccountId = (url?: string) => {
  if (!url) return null
  const match = url.match(/([a-f0-9]{32})/i)
  return match ? match[1] : null
}

const accountId = extractAccountId(process.env.S3_URL)

// Initialize R2 client with proper configuration
const r2Client = new S3Client({
  // R2 specific configuration
  region: 'auto',
  endpoint: accountId 
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : process.env.S3_URL || process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim() || '',
  },
  // Important: R2 does NOT use path-style URLs
  forcePathStyle: false,
})

// Get bucket name from environment
const BUCKET_NAME = process.env.R2_BUCKET || 'store'

export class R2StorageV2 {
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
   * Test connection with a simple operation
   */
  static async testConnection() {
    try {
      // Try to list objects (simplest operation)
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 1,
      })
      
      const result = await r2Client.send(command)
      return {
        success: true,
        message: 'Connection successful',
        bucket: BUCKET_NAME,
        keyCount: result.KeyCount || 0,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Connection failed',
        error: error.message || String(error),
        code: error.Code,
      }
    }
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
    } catch (error: any) {
      console.error('R2 V2 upload error:', error)
      return {
        success: false,
        error: error.message || String(error),
        code: error.Code,
      }
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
    } catch (error: any) {
      console.error('R2 V2 get error:', error)
      return {
        success: false,
        error: error.message || String(error),
        code: error.Code,
      }
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
    } catch (error: any) {
      console.error('R2 V2 delete error:', error)
      return {
        success: false,
        error: error.message || String(error),
        code: error.Code,
      }
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
        count: result.KeyCount || 0,
        isTruncated: result.IsTruncated,
      }
    } catch (error: any) {
      console.error('R2 V2 list error:', error)
      return {
        success: false,
        error: error.message || String(error),
        code: error.Code,
        files: [],
        count: 0,
      }
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
    } catch (error: any) {
      console.error('R2 V2 presigned URL error:', error)
      return {
        success: false,
        error: error.message || String(error),
        code: error.Code,
        url: '',
      }
    }
  }
}

export default R2StorageV2