import { NextResponse } from 'next/server'
import { R2StorageV2 } from '@/core/storage/r2/client'

export async function GET() {
  try {
    // Check if R2 is configured
    const isConfigured = R2StorageV2.isConfigured()
    
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

    console.log('Testing R2 V2 connection...')
    console.log('Endpoint:', process.env.S3_URL)
    console.log('Bucket:', process.env.R2_BUCKET)
    console.log('Access Key ID length:', process.env.R2_ACCESS_KEY_ID?.length)
    
    // Test basic connection first
    const connectionTest = await R2StorageV2.testConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({
        status: 'connection_failed',
        message: '❌ R2 connection failed',
        error: connectionTest.error,
        errorCode: connectionTest.code,
        configuration: {
          endpoint: process.env.S3_URL,
          bucket: process.env.R2_BUCKET,
          accessKeyId: process.env.R2_ACCESS_KEY_ID?.substring(0, 10) + '...',
        },
        recommendation: 'Please verify your R2 credentials in Cloudflare dashboard'
      }, { status: 500 })
    }

    const testResults: any = {
      connection: '✅ Connected',
      bucket: process.env.R2_BUCKET || 'store',
      endpoint: process.env.S3_URL?.split('//')[1]?.split('.')[0],
    }

    // Test upload
    const testKey = `test/r2-test-${Date.now()}.txt`
    const testContent = `R2 test at ${new Date().toISOString()}`
    
    const uploadResult = await R2StorageV2.upload(testKey, testContent, 'text/plain')
    testResults.upload = uploadResult.success ? '✅ Success' : `❌ Failed: ${uploadResult.error}`
    
    if (uploadResult.success) {
      // Test retrieve
      const getResult = await R2StorageV2.get(testKey)
      testResults.retrieve = getResult.success ? '✅ Success' : `❌ Failed: ${getResult.error}`
      testResults.contentMatches = getResult.body === testContent ? '✅ Yes' : '❌ No'
      
      // Test list
      const listResult = await R2StorageV2.list('test/', 5)
      testResults.list = listResult.success ? `✅ Found ${listResult.count} files` : `❌ Failed: ${listResult.error}`
      
      // Test delete
      const deleteResult = await R2StorageV2.delete(testKey)
      testResults.delete = deleteResult.success ? '✅ Success' : `❌ Failed: ${deleteResult.error}`
    }

    return NextResponse.json({
      status: 'success',
      message: '✅ R2 Storage V2 test completed',
      tests: testResults,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('R2 V2 test error:', error)
    return NextResponse.json({
      status: 'error',
      message: '❌ R2 Storage test failed',
      error: error.message || String(error),
      stack: error.stack,
    }, { status: 500 })
  }
}