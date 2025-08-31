import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IFileModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import multer from "multer"

// Configure multer for this endpoint
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20 // Maximum 20 files per request
  }
})

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const fileModuleService: IFileModuleService = req.scope.resolve(Modules.FILE)
  
  // Handle multipart parsing
  const uploadMiddleware = upload.any()
  
  return new Promise<void>((resolve) => {
    uploadMiddleware(req as any, res as any, async (err) => {
      if (err) {
        console.error('❌ Multer parsing error:', err)
        res.status(400).json({
          error: 'File parsing failed',
          message: err.message
        })
        resolve()
        return
      }
      
      try {
        await handleUpload(req, res, fileModuleService)
        resolve()
      } catch (error) {
        console.error('❌ Upload handler error:', error)
        res.status(500).json({
          error: 'Upload failed',
          message: error.message
        })
        resolve()
      }
    })
  })
}

async function handleUpload(
  req: MedusaRequest, 
  res: MedusaResponse, 
  fileModuleService: IFileModuleService
) {
  
  try {
    console.log('📁 Upload request received:', {
      files: (req as any).files?.length || 0,
      body: req.body,
      contentType: req.headers['content-type']
    })

    const files = (req as any).files as any[]
    const body = req.body as any
    const { product_id, category = 'general', user_id } = body || {}
    
    if (!files || files.length === 0) {
      console.log('❌ No files in request')
      return res.status(400).json({ 
        error: "No files provided",
        message: "Please select at least one file to upload. Make sure files are properly attached to the form." 
      })
    }

    console.log(`📤 Processing ${files.length} files for upload`)

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    
    const validationErrors = []
    
    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        validationErrors.push(`${file.originalname}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`)
      }
      if (file.size > maxFileSize) {
        validationErrors.push(`${file.originalname}: File too large. Maximum size is 10MB.`)
      }
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "File validation failed",
        details: validationErrors
      })
    }

    const uploadedFiles: any[] = []
    const errors: string[] = []

    // Upload files with organized structure using Medusa's file service
    for (const file of files) {
      try {
        // Create organized path with product/user context
        const timestamp = Date.now()
        const uuid = Math.random().toString(36).substring(2, 8)
        const originalName = file.originalname?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'unnamed'
        
        let pathPrefix = 'public/general'
        if (product_id) {
          pathPrefix = `products/${product_id}/images`
        } else if (user_id) {
          pathPrefix = `users/${user_id}/uploads`
        } else if (category !== 'general') {
          pathPrefix = `public/${category}`
        }
        
        // Create Medusa-compatible file object
        const customFile = {
          filename: `${pathPrefix}/${timestamp}_${uuid}_${originalName}`,
          mimeType: file.mimetype,
          content: file.buffer.toString('base64')
        }

        const uploadResult = await fileModuleService.createFiles([customFile])
        
        uploadedFiles.push({
          ...uploadResult[0],
          originalName: file.originalname,
          category,
          productId: product_id,
          userId: user_id
        })

        console.log(`✅ File uploaded successfully: ${uploadResult[0].url}`)

      } catch (error: any) {
        console.error(`❌ Failed to upload ${file.originalname}:`, error)
        errors.push(`${file.originalname}: ${error.message}`)
      }
    }

    const response = {
      uploads: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully to Cloudflare R2`,
      storage: {
        provider: 'Cloudflare R2',
        bucket: process.env.S3_BUCKET_NAME,
        cdn: process.env.S3_PUBLIC_URL
      },
      ...(errors.length > 0 && { 
        errors,
        warning: `${errors.length} file(s) failed to upload`
      })
    }

    // Return success if at least one file uploaded, partial success otherwise
    const statusCode = uploadedFiles.length > 0 ? 200 : 400
    
    res.status(statusCode).json(response)

  } catch (error: any) {
    console.error("❌ Upload service error:", error)
    res.status(500).json({ 
      error: "Upload service failed", 
      message: "Internal server error occurred during file upload",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}