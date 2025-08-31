import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IFileModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const fileModuleService: IFileModuleService = req.scope.resolve(Modules.FILE)
  
  try {
    const files = (req as any).files as Express.Multer.File[]
    const body = req.body as any
    const { product_id, category = 'products' } = body || {}
    
    if (!files || files.length === 0) {
      return res.status(400).json({ 
        error: "No files provided",
        message: "Please select at least one file to upload"
      })
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    
    const validationErrors: string[] = []
    
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

    for (const file of files) {
      try {
        // Create organized path with product ID and timestamp
        const timestamp = Date.now()
        const uuid = Math.random().toString(36).substring(2, 8)
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
        
        const productPrefix = product_id ? 
          `products/${product_id}/images` : 
          `products/general`
        
        // Create Medusa-compatible file object
        const customFile = {
          filename: `${productPrefix}/${timestamp}_${uuid}_${originalName}`,
          mimeType: file.mimetype,
          content: file.buffer.toString('base64')
        }

        const uploadResult = await fileModuleService.createFiles([customFile])
        uploadedFiles.push({
          ...uploadResult[0],
          originalName: file.originalname,
          category,
          productId: product_id
        })

        console.log(`✅ File uploaded via Medusa service: ${uploadResult[0].url}`)

      } catch (error: any) {
        console.error(`❌ Failed to upload ${file.originalname}:`, error)
        errors.push(`${file.originalname}: ${error.message}`)
      }
    }

    const response = {
      uploads: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully using Medusa file service`,
      ...(errors.length > 0 && { 
        errors,
        warning: `${errors.length} file(s) failed to upload`
      })
    }

    const statusCode = uploadedFiles.length > 0 ? 200 : 400
    res.status(statusCode).json(response)

  } catch (error: any) {
    console.error("❌ Medusa file service error:", error)
    res.status(500).json({ 
      error: "File service failed", 
      message: "Internal server error occurred during file upload",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}