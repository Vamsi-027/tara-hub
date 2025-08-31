import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { S3 } from "aws-sdk"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    console.log('📁 Simple upload endpoint called')
    console.log('Headers:', req.headers)
    console.log('Content-Type:', req.headers['content-type'])
    
    // Check if this is a multipart request
    if (!req.headers['content-type']?.includes('multipart/form-data')) {
      return res.status(400).json({
        error: 'Invalid content type',
        message: 'Expected multipart/form-data'
      })
    }

    // For now, just return a success response to test
    res.json({
      message: 'Upload endpoint is reachable',
      uploads: [],
      success: true
    })

  } catch (error: any) {
    console.error('❌ Simple upload error:', error)
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    })
  }
}