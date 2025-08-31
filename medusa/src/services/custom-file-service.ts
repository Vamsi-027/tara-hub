import { S3 } from "aws-sdk"
import { v4 as uuidv4 } from 'uuid'

interface CloudflareFileUploadOptions {
  productId?: string
  userId?: string
  category?: string
  isPublic?: boolean
}

interface FileUploadResult {
  url: string
  key: string
  location?: string
  etag?: string
  bucket?: string
}

class CustomS3FileService {
  protected s3_: S3
  protected bucket_: string
  protected publicUrl_: string
  protected logger_: any

  constructor({ s3Config }: { s3Config: any }) {
    this.s3_ = new S3({
      endpoint: s3Config.endpoint,
      accessKeyId: s3Config.access_key_id,
      secretAccessKey: s3Config.secret_access_key,
      region: s3Config.region,
      s3ForcePathStyle: true,
    })

    this.bucket_ = s3Config.bucket
    this.publicUrl_ = s3Config.file_url
    this.logger_ = console // In production, use proper logger
  }

  /**
   * Generate organized storage path based on file type and context
   */
  private generateStoragePath(
    fileName: string, 
    options: CloudflareFileUploadOptions = {}
  ): string {
    const timestamp = Date.now()
    const uuid = uuidv4().split('-')[0] // Short UUID for uniqueness
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    const { productId, userId, category = 'general', isPublic = true } = options
    
    if (productId) {
      return `products/${productId}/images/${timestamp}_${uuid}_${sanitizedFileName}`
    }
    
    if (userId) {
      return `users/${userId}/uploads/${timestamp}_${uuid}_${sanitizedFileName}`
    }
    
    // Categories for different asset types
    const basePath = isPublic ? 'public' : 'private'
    return `${basePath}/${category}/${timestamp}_${uuid}_${sanitizedFileName}`
  }

  async upload(
    file: any, 
    options: CloudflareFileUploadOptions = {}
  ): Promise<FileUploadResult> {
    const retryAttempts = 3
    let lastError: Error
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        const key = this.generateStoragePath(file.originalname || 'unnamed', options)
        
        this.logger_.info(`Uploading file to Cloudflare R2: ${key} (attempt ${attempt})`)

        const uploadResult = await this.s3_.upload({
          Bucket: this.bucket_,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000', // 1 year cache
          Metadata: {
            'original-name': file.originalname || '',
            'upload-timestamp': Date.now().toString(),
            'product-id': options.productId || '',
            'category': options.category || 'general'
          }
        }).promise()

        const url = `${this.publicUrl_}/${key}`
        
        this.logger_.info(`File uploaded successfully: ${url}`)
        
        return {
          url,
          key,
          location: uploadResult.Location,
          etag: uploadResult.ETag,
          bucket: uploadResult.Bucket
        }
        
      } catch (error) {
        lastError = error as Error
        this.logger_.warn(`Upload attempt ${attempt} failed:`, error.message)
        
        if (attempt === retryAttempts) {
          this.logger_.error('All upload attempts failed:', error)
          throw new Error(`Failed to upload file after ${retryAttempts} attempts: ${error.message}`)
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
    
    throw lastError!
  }

  async uploadProtected(
    file: any, 
    options: CloudflareFileUploadOptions = {}
  ): Promise<FileUploadResult> {
    return this.upload(file, { ...options, isPublic: false })
  }

  /**
   * Delete file with retry logic
   */
  async delete(fileKey: string): Promise<void> {
    const retryAttempts = 3
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        this.logger_.info(`Deleting file from Cloudflare R2: ${fileKey} (attempt ${attempt})`)
        
        await this.s3_.deleteObject({
          Bucket: this.bucket_,
          Key: fileKey,
        }).promise()
        
        this.logger_.info(`File deleted successfully: ${fileKey}`)
        return
        
      } catch (error) {
        this.logger_.warn(`Delete attempt ${attempt} failed:`, error.message)
        
        if (attempt === retryAttempts) {
          this.logger_.error('All delete attempts failed:', error)
          throw new Error(`Failed to delete file after ${retryAttempts} attempts: ${error.message}`)
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }

  /**
   * Bulk delete multiple files
   */
  async deleteMany(fileKeys: string[]): Promise<void> {
    if (fileKeys.length === 0) return
    
    try {
      const deleteParams = {
        Bucket: this.bucket_,
        Delete: {
          Objects: fileKeys.map(key => ({ Key: key })),
          Quiet: false
        }
      }
      
      const result = await this.s3_.deleteObjects(deleteParams).promise()
      
      if (result.Errors && result.Errors.length > 0) {
        this.logger_.error('Some files failed to delete:', result.Errors)
        throw new Error(`Failed to delete ${result.Errors.length} files`)
      }
      
      this.logger_.info(`Successfully deleted ${result.Deleted?.length || 0} files`)
      
    } catch (error) {
      this.logger_.error('Bulk delete failed:', error)
      throw error
    }
  }

  async getUploadStreamDescriptor(fileData: any): Promise<any> {
    throw new Error("Upload stream not implemented for Cloudflare R2")
  }

  async getDownloadStream(fileData: any): Promise<any> {
    try {
      const params = {
        Bucket: this.bucket_,
        Key: fileData.key,
      }

      return this.s3_.getObject(params).createReadStream()
    } catch (error) {
      this.logger_.error('Failed to get download stream:', error)
      throw error
    }
  }

  /**
   * Get presigned URL for secure downloads
   */
  async getPresignedDownloadUrl(
    fileData: any, 
    expiresInMinutes: number = 5
  ): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket_,
        Key: fileData.key,
        Expires: 60 * expiresInMinutes,
      }

      return await this.s3_.getSignedUrlPromise('getObject', params)
    } catch (error) {
      this.logger_.error('Failed to generate presigned URL:', error)
      throw error
    }
  }

  /**
   * Get presigned URL for secure uploads
   */
  async getPresignedUploadUrl(
    fileName: string,
    contentType: string,
    options: CloudflareFileUploadOptions = {}
  ): Promise<{ url: string; key: string }> {
    try {
      const key = this.generateStoragePath(fileName, options)
      
      const params = {
        Bucket: this.bucket_,
        Key: key,
        ContentType: contentType,
        Expires: 60 * 5, // 5 minutes to upload
      }

      const url = await this.s3_.getSignedUrlPromise('putObject', params)
      
      return { url, key }
    } catch (error) {
      this.logger_.error('Failed to generate presigned upload URL:', error)
      throw error
    }
  }

  /**
   * Check if file exists
   */
  async exists(fileKey: string): Promise<boolean> {
    try {
      await this.s3_.headObject({
        Bucket: this.bucket_,
        Key: fileKey,
      }).promise()
      
      return true
    } catch (error) {
      if (error.statusCode === 404) {
        return false
      }
      throw error
    }
  }
}

export default CustomS3FileService