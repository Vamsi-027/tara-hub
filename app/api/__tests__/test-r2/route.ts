import { NextResponse } from 'next/server'
import { R2Storage } from '@/core/storage/r2/client'

export async function GET() {
  try {
    // Check if R2 is configured
    const isConfigured = R2Storage.isConfigured()
    
    if (!isConfigured) {
      return NextResponse.json({
        status: 'not_configured',
        message: '❌ R2 Storage is not configured',
        configuration: {
          R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing',
          R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing',
          S3_URL: process.env.S3_URL ? '✅ Set' : '❌ Missing',
          R2_BUCKET: process.env.R2_BUCKET || 'store (default)',
        }
      }, { status: 503 })
    }

    const testResults: any = {
      configuration: '✅ Configured',
      endpoint: process.env.S3_URL?.split('//')[1]?.split('.')[0] || 'unknown',
      bucket: process.env.R2_BUCKET || 'store',
    }

    // Test 1: Upload a test file
    const testKey = `test/connection-test-${Date.now()}.json`
    const testData = {
      timestamp: new Date().toISOString(),
      message: 'R2 Storage test successful',
      service: 'Cloudflare R2',
    }

    try {
      console.log('Testing R2 upload...')
      const uploadResult = await R2Storage.upload(
        testKey,
        JSON.stringify(testData, null, 2),
        'application/json'
      )
      testResults.upload = '✅ Success'
      testResults.uploadDetails = uploadResult
      console.log('Upload successful:', uploadResult)
    } catch (error) {
      testResults.upload = '❌ Failed'
      testResults.uploadError = String(error)
      console.error('Upload failed:', error)
    }

    // Test 2: Retrieve the uploaded file
    if (testResults.upload === '✅ Success') {
      try {
        console.log('Testing R2 retrieval...')
        const getResult = await R2Storage.get(testKey)
        testResults.retrieve = '✅ Success'
        testResults.retrievedData = JSON.parse(getResult.body || '{}')
        testResults.contentType = getResult.contentType
        console.log('Retrieval successful')
      } catch (error) {
        testResults.retrieve = '❌ Failed'
        testResults.retrieveError = String(error)
        console.error('Retrieval failed:', error)
      }
    }

    // Test 3: List files in the bucket
    try {
      console.log('Testing R2 list...')
      const listResult = await R2Storage.list('test/', 5)
      testResults.list = '✅ Success'
      testResults.filesFound = listResult.count
      testResults.recentFiles = listResult.files?.slice(0, 3).map(f => f.key)
      console.log(`Found ${listResult.count} files`)
    } catch (error) {
      testResults.list = '❌ Failed'
      testResults.listError = String(error)
      console.error('List failed:', error)
    }

    // Test 4: Generate presigned URL
    if (testResults.upload === '✅ Success') {
      try {
        console.log('Testing presigned URL generation...')
        const presignedResult = await R2Storage.getPresignedUrl(testKey, 'get', 300)
        testResults.presignedUrl = '✅ Generated'
        testResults.urlExpiresIn = `${presignedResult.expiresIn} seconds`
        console.log('Presigned URL generated')
      } catch (error) {
        testResults.presignedUrl = '❌ Failed'
        testResults.presignedError = String(error)
        console.error('Presigned URL failed:', error)
      }
    }

    // Test 5: Delete the test file
    if (testResults.upload === '✅ Success') {
      try {
        console.log('Testing R2 deletion...')
        const deleteResult = await R2Storage.delete(testKey)
        testResults.delete = '✅ Success'
        console.log('Deletion successful')
      } catch (error) {
        testResults.delete = '❌ Failed'
        testResults.deleteError = String(error)
        console.error('Deletion failed:', error)
      }
    }

    // Overall status
    const allTestsPassed = 
      testResults.upload === '✅ Success' &&
      testResults.retrieve === '✅ Success' &&
      testResults.list === '✅ Success' &&
      testResults.delete === '✅ Success'

    return NextResponse.json({
      status: allTestsPassed ? 'success' : 'partial',
      message: allTestsPassed 
        ? '✅ All R2 Storage tests passed successfully!' 
        : '⚠️ Some R2 Storage tests failed',
      storage: 'Cloudflare R2',
      tests: testResults,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('R2 test error:', error)
    return NextResponse.json({
      status: 'error',
      message: '❌ R2 Storage test failed',
      error: String(error),
      configuration: {
        R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? 'Set' : 'Missing',
        R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
        S3_URL: process.env.S3_URL ? 'Set' : 'Missing',
        R2_BUCKET: process.env.R2_BUCKET || 'store',
      }
    }, { status: 500 })
  }
}

// Test file upload endpoint
export async function POST(request: Request) {
  try {
    if (!R2Storage.isConfigured()) {
      return NextResponse.json({
        error: 'R2 Storage is not configured'
      }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({
        error: 'No file provided'
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique key
    const key = `uploads/${Date.now()}-${file.name}`

    // Upload to R2
    const result = await R2Storage.upload(key, buffer, file.type)

    // Generate a presigned URL for viewing
    const presignedUrl = await R2Storage.getPresignedUrl(key, 'get', 3600)

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      key,
      filename: file.name,
      size: file.size,
      type: file.type,
      etag: result.etag,
      viewUrl: presignedUrl.url,
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      error: 'Upload failed',
      details: String(error)
    }, { status: 500 })
  }
}