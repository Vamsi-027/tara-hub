import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IFileModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const fileModuleService: IFileModuleService = req.scope.resolve(Modules.FILE)
  
  try {
    console.log('📁 Catchall upload request received:', {
      path: req.path,
      files: (req as any).files?.length || 0,
      body: req.body,
      contentType: req.headers['content-type'],
      method: req.method
    })

    const files = (req as any).files as any[]
    const body = req.body as any
    
    if (!files || files.length === 0) {
      console.log('❌ No files in catchall request')
      return res.status(400).json({ 
        error: "No files provided",
        message: "No files were received in the request"
      })
    }

    console.log(`📤 Catchall processing ${files.length} files`)

    const uploadedFiles: any[] = []
    const errors: string[] = []

    for (const file of files) {
      try {
        console.log(`📋 Processing file: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`)
        
        // Create timestamp and unique identifier
        const timestamp = Date.now()
        const uuid = Math.random().toString(36).substring(2, 8)
        const originalName = file.originalname?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'unnamed'
        
        // Default to products/general if no specific context
        const pathPrefix = 'products/general'
        
        // Create Medusa-compatible file object
        const customFile = {
          filename: `${pathPrefix}/${timestamp}_${uuid}_${originalName}`,
          mimeType: file.mimetype,
          content: file.buffer.toString('base64')
        }

        console.log(`🎯 Uploading to: ${customFile.filename}`)

        const uploadResult = await fileModuleService.createFiles([customFile])
        
        uploadedFiles.push({
          ...uploadResult[0],
          originalName: file.originalname
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

    console.log('📊 Upload response:', {
      successful: uploadedFiles.length,
      failed: errors.length,
      urls: uploadedFiles.map(f => f.url)
    })

    const statusCode = uploadedFiles.length > 0 ? 200 : 400
    res.status(statusCode).json(response)

  } catch (error: any) {
    console.error("❌ Catchall upload service error:", error)
    res.status(500).json({ 
      error: "Upload service failed", 
      message: "Internal server error occurred during file upload",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}