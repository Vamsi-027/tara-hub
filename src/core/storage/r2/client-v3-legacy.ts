import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadBucketCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Parse the S3 URL to extract account ID
function parseR2Endpoint(url?: string) {
  if (!url) return null
  
  // Extract account ID from URL patterns like:
  // https://4d1cef7ad43a8fb0b3868c1a3c75b8e2.r2.cloudflarestorage.com
  const match = url.match(/https?:\/\/([a-f0-9]{32})\.r2\.cloudflarestorage\.com/i)
  if (match) {
    return {
      accountId: match[1],
      endpoint: url
    }
  }
  
  // Also try to extract from other formats
  const accountMatch = url.match(/([a-f0-9]{32})/i)
  if (accountMatch) {
    return {
      accountId: accountMatch[1],
      endpoint: `https://${accountMatch[1]}.r2.cloudflarestorage.com`
    }
  }
  
  return null
}

const r2Config = parseR2Endpoint(process.env.S3_URL)

// Initialize R2 client with minimal configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: r2Config?.endpoint || process.env.S3_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.R2_BUCKET || 'store'

export class R2StorageV3 {
  /**
   * Check if R2 is configured
   */
  static isConfigured(): boolean {
    return !!(
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.S3_URL
    )
  }

  /**
   * Get configuration details
   */
  static getConfig() {
    return {
      accountId: r2Config?.accountId,
      endpoint: r2Config?.endpoint || process.env.S3_URL,
      bucket: BUCKET_NAME,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      accessKeyLength: process.env.R2_ACCESS_KEY_ID?.length,
      secretKeyLength: process.env.R2_SECRET_ACCESS_KEY?.length,
    }
  }

  /**
   * Test connection with HeadBucket operation
   */
  static async testConnection() {
    try {
      // Use HeadBucket - the simplest R2 operation
      const command = new HeadBucketCommand({
        Bucket: BUCKET_NAME,
      })
      
      await r2Client.send(command)
      return {
        success: true,
        message: 'Connection successful',
        bucket: BUCKET_NAME,
      }
    } catch (error: any) {
      // Check if it's a 404 (bucket doesn't exist) vs auth error
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return {
          success: false,
          message: 'Bucket not found',
          error: `Bucket '${BUCKET_NAME}' does not exist`,
          code: 'NoSuchBucket',
        }
      }
      
      return {
        success: false,
        message: 'Connection failed',
        error: error.message || String(error),
        code: error.name || error.Code,
        statusCode: error.$metadata?.httpStatusCode,
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
      console.error('R2 V3 upload error:', error)
      return {
        success: false,
        error: error.message || String(error),
        code: error.name || error.Code,
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
      
      // Handle binary data properly for images
      const body = await result.Body?.transformToByteArray()
      
      return {
        success: true,
        body,
        contentType: result.ContentType,
        contentLength: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
      }
    } catch (error: any) {
      console.error('R2 V3 get error:', error)
      return {
        success: false,
        error: error.message || String(error),
        code: error.name || error.Code,
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
      console.error('R2 V3 delete error:', error)
      return {
        success: false,
        error: error.message || String(error),
        code: error.name || error.Code,
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
      console.error('R2 V3 list error:', error)
      return {
        success: false,
        error: error.message || String(error),
        code: error.name || error.Code,
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
      console.error('R2 V3 presigned URL error:', error)
      return {
        success: false,
        error: error.message || String(error),
        code: error.name || error.Code,
        url: '',
      }
    }
  }
}

export default R2StorageV3