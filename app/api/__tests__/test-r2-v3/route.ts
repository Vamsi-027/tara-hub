import { NextResponse } from 'next/server'
import { R2StorageV3 } from '@/core/storage/r2/client'

export async function GET() {
  try {
    // Check if R2 is configured
    const isConfigured = R2StorageV3.isConfigured()
    const config = R2StorageV3.getConfig()
    
    if (!isConfigured) {
      return NextResponse.json({
        status: 'not_configured',
        message: '❌ R2 Storage is not configured',
        configuration: {
          R2_ACCESS_KEY_ID: config.hasAccessKey ? '✅ Set' : '❌ Missing',
          R2_SECRET_ACCESS_KEY: config.hasSecretKey ? '✅ Set' : '❌ Missing',
          S3_URL: config.endpoint ? '✅ Set' : '❌ Missing',
          R2_BUCKET: config.bucket,
        },
        details: config
      }, { status: 503 })
    }

    console.log('\n=== R2 V3 Configuration ===')
    console.log('Account ID:', config.accountId)
    console.log('Endpoint:', config.endpoint)
    console.log('Bucket:', config.bucket)
    console.log('Access Key Length:', config.accessKeyLength)
    console.log('Secret Key Length:', config.secretKeyLength)
    console.log('========================\n')
    
    // Test basic connection with HeadBucket
    console.log('Testing R2 V3 connection with HeadBucket...')
    const connectionTest = await R2StorageV3.testConnection()
    
    if (!connectionTest.success) {
      console.error('Connection failed:', connectionTest)
      
      // Provide detailed error information
      let recommendation = 'Please check your R2 configuration.'
      
      if (connectionTest.code === 'SignatureDoesNotMatch') {
        recommendation = 'Authentication failed. Please verify:\n' +
          '1. Your R2 API token has the correct permissions (Admin Read & Write)\n' +
          '2. The credentials are copied correctly without extra spaces\n' +
          '3. The API token was created for the correct account\n' +
          '4. Try regenerating the API token in Cloudflare dashboard'
      } else if (connectionTest.code === 'NoSuchBucket') {
        recommendation = `Bucket '${config.bucket}' does not exist. Please create it in Cloudflare R2 dashboard.`
      } else if (connectionTest.code === 'InvalidAccessKeyId') {
        recommendation = 'The Access Key ID is invalid. Please check your R2 API token.'
      }
      
      return NextResponse.json({
        status: 'connection_failed',
        message: '❌ R2 connection failed',
        error: connectionTest.error,
        errorCode: connectionTest.code,
        statusCode: connectionTest.statusCode,
        configuration: config,
        recommendation,
        debugInfo: {
          endpoint: config.endpoint,
          bucket: config.bucket,
          accountId: config.accountId,
          accessKeyFormat: process.env.R2_ACCESS_KEY_ID ? 
            `${process.env.R2_ACCESS_KEY_ID.substring(0, 8)}...` : 'not set',
        }
      }, { status: 500 })
    }

    console.log('✅ Connection successful!')
    
    const testResults: any = {
      connection: '✅ Connected',
      bucket: config.bucket,
      endpoint: config.endpoint,
      accountId: config.accountId,
    }

    // Test upload
    const testKey = `test/r2-v3-test-${Date.now()}.txt`
    const testContent = `R2 V3 test at ${new Date().toISOString()}`
    
    console.log('Testing upload...')
    const uploadResult = await R2StorageV3.upload(testKey, testContent, 'text/plain')
    testResults.upload = uploadResult.success ? '✅ Success' : `❌ Failed: ${uploadResult.error}`
    
    if (uploadResult.success) {
      console.log('✅ Upload successful')
      
      // Test retrieve
      console.log('Testing retrieve...')
      const getResult = await R2StorageV3.get(testKey)
      testResults.retrieve = getResult.success ? '✅ Success' : `❌ Failed: ${getResult.error}`
      testResults.contentMatches = getResult.body === testContent ? '✅ Yes' : '❌ No'
      
      if (getResult.success) {
        console.log('✅ Retrieve successful')
      }
      
      // Test list
      console.log('Testing list...')
      const listResult = await R2StorageV3.list('test/', 5)
      testResults.list = listResult.success ? `✅ Found ${listResult.count} files` : `❌ Failed: ${listResult.error}`
      
      if (listResult.success) {
        console.log(`✅ List successful - found ${listResult.count} files`)
      }
      
      // Test delete
      console.log('Testing delete...')
      const deleteResult = await R2StorageV3.delete(testKey)
      testResults.delete = deleteResult.success ? '✅ Success' : `❌ Failed: ${deleteResult.error}`
      
      if (deleteResult.success) {
        console.log('✅ Delete successful')
      }
    }

    console.log('\n=== Test Results ===')
    console.log(JSON.stringify(testResults, null, 2))
    console.log('==================\n')

    return NextResponse.json({
      status: 'success',
      message: '✅ R2 Storage V3 test completed',
      tests: testResults,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error('R2 V3 test error:', error)
    return NextResponse.json({
      status: 'error',
      message: '❌ R2 Storage test failed',
      error: error.message || String(error),
      stack: error.stack,
    }, { status: 500 })
  }
}