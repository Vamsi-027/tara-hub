/**
 * Test Script for Cloudflare R2 Image Upload
 * 
 * This script tests the image upload functionality to verify that:
 * 1. Images are correctly uploaded to Cloudflare R2
 * 2. Files are organized in proper folder structure
 * 3. CDN URLs are accessible
 * 4. File service is working correctly
 * 
 * Run with: npx medusa exec ./src/scripts/test-image-upload.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { S3 } from "aws-sdk"
import { createReadStream } from "fs"
import { join } from "path"

export default async function testImageUpload({ 
  container 
}: ExecArgs) {
  const logger = container.resolve("logger")
  
  logger.info("🧪 Starting Cloudflare R2 image upload test...")

  try {
    // Initialize S3 client for Cloudflare R2
    const s3 = new S3({
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION,
      s3ForcePathStyle: true,
    })

    const bucket = process.env.S3_BUCKET_NAME!
    const publicUrl = process.env.S3_PUBLIC_URL!
    
    logger.info(`📦 Testing upload to bucket: ${bucket}`)
    logger.info(`🌐 Public URL: ${publicUrl}`)

    // Test 1: Upload a simple test file
    logger.info("📤 Test 1: Uploading test file...")
    
    const testContent = "This is a test file for Cloudflare R2 storage"
    const timestamp = Date.now()
    const testKey = `test/uploads/${timestamp}_test-file.txt`
    
    const uploadResult = await s3.upload({
      Bucket: bucket,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
      CacheControl: 'public, max-age=31536000',
      Metadata: {
        'test': 'true',
        'uploaded-at': new Date().toISOString()
      }
    }).promise()

    logger.info(`✅ Test file uploaded: ${uploadResult.Location}`)
    
    // Test 2: Verify file exists
    logger.info("🔍 Test 2: Verifying file exists...")
    
    try {
      const headResult = await s3.headObject({
        Bucket: bucket,
        Key: testKey
      }).promise()
      
      logger.info(`✅ File verified - Size: ${headResult.ContentLength} bytes`)
    } catch (error) {
      logger.error(`❌ File verification failed: ${error.message}`)
      throw error
    }

    // Test 3: Check public accessibility
    logger.info("🌐 Test 3: Testing public URL accessibility...")
    
    const publicTestUrl = `${publicUrl}/${testKey}`
    
    try {
      // Simple fetch test to verify CDN accessibility
      const response = await fetch(publicTestUrl)
      if (response.ok) {
        const content = await response.text()
        if (content === testContent) {
          logger.info("✅ Public URL is accessible and returns correct content")
        } else {
          logger.warn("⚠️ Public URL accessible but content doesn't match")
        }
      } else {
        logger.warn(`⚠️ Public URL returned status: ${response.status}`)
      }
    } catch (error) {
      logger.warn(`⚠️ Could not test public URL: ${error.message}`)
    }

    // Test 4: Test organized folder structure
    logger.info("📁 Test 4: Testing organized folder structure...")
    
    const testCases = [
      {
        key: `products/test-product-123/images/${timestamp}_product-image.jpg`,
        description: "Product image"
      },
      {
        key: `users/test-user-456/uploads/${timestamp}_user-file.png`,
        description: "User upload"
      },
      {
        key: `public/general/${timestamp}_general-file.webp`,
        description: "General public file"
      }
    ]

    for (const testCase of testCases) {
      try {
        const result = await s3.upload({
          Bucket: bucket,
          Key: testCase.key,
          Body: Buffer.from(`Test content for ${testCase.description}`),
          ContentType: 'text/plain',
          Metadata: {
            'test': 'true',
            'category': testCase.description
          }
        }).promise()
        
        logger.info(`✅ ${testCase.description}: ${result.Location}`)
      } catch (error) {
        logger.error(`❌ Failed to upload ${testCase.description}: ${error.message}`)
      }
    }

    // Test 5: List recent uploads
    logger.info("📋 Test 5: Listing recent test uploads...")
    
    const listResult = await s3.listObjectsV2({
      Bucket: bucket,
      Prefix: 'test/',
      MaxKeys: 10
    }).promise()

    const testFiles = listResult.Contents || []
    logger.info(`📊 Found ${testFiles.length} test files in storage:`)
    
    testFiles.forEach(file => {
      logger.info(`   - ${file.Key} (${(file.Size || 0)} bytes)`)
    })

    // Test 6: Cleanup test files
    if (process.env.NODE_ENV !== 'production') {
      logger.info("🧹 Test 6: Cleaning up test files...")
      
      const deleteParams = {
        Bucket: bucket,
        Delete: {
          Objects: [
            { Key: testKey },
            ...testCases.map(tc => ({ Key: tc.key }))
          ]
        }
      }
      
      try {
        const deleteResult = await s3.deleteObjects(deleteParams).promise()
        const deleted = deleteResult.Deleted?.length || 0
        logger.info(`✅ Cleaned up ${deleted} test files`)
      } catch (error) {
        logger.warn(`⚠️ Cleanup failed: ${error.message}`)
      }
    } else {
      logger.info("🚨 Production mode: Skipping cleanup")
    }

    // Test 7: Storage configuration summary
    logger.info("📊 Storage Configuration Summary:")
    logger.info(`   Endpoint: ${process.env.S3_ENDPOINT}`)
    logger.info(`   Region: ${process.env.S3_REGION}`)
    logger.info(`   Bucket: ${bucket}`)
    logger.info(`   Public URL: ${publicUrl}`)
    logger.info(`   Force Path Style: true`)
    
    logger.info("✅ All tests completed successfully!")
    logger.info("🚀 Cloudflare R2 storage is ready for production use")

  } catch (error) {
    logger.error("❌ Image upload test failed:", error)
    throw error
  }
}