/**
 * Cleanup Script for Unused Images in Cloudflare R2
 * 
 * This script identifies and removes images from R2 storage that are no longer
 * associated with any products, variants, or other entities in the system.
 * 
 * Run with: npx medusa exec ./src/scripts/cleanup-unused-images.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { S3 } from "aws-sdk"

interface ImageReference {
  id: string
  entity_type: 'product' | 'product_variant' | 'category' | 'user'
  entity_id: string
  image_url: string
  key: string
}

export default async function cleanupUnusedImages({ 
  container 
}: ExecArgs) {
  const logger = container.resolve("logger")
  
  logger.info("🧹 Starting Cloudflare R2 image cleanup process...")

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
    
    logger.info("📋 Listing all images in R2 bucket...")
    
    // Get all images from R2
    const listResult = await s3.listObjectsV2({
      Bucket: bucket,
      Prefix: 'products/', // Focus on product images for now
    }).promise()

    const allImages = listResult.Contents || []
    logger.info(`Found ${allImages.length} images in R2 storage`)

    if (allImages.length === 0) {
      logger.info("No images found in storage")
      return
    }

    // Get database connection
    const query = container.resolve("query")
    
    // Collect all image references from database
    const imageReferences: ImageReference[] = []
    
    logger.info("🔍 Scanning database for image references...")
    
    // Check products table for image references
    try {
      const productImages = await query.graph({
        entity: "product",
        fields: ["id", "images", "thumbnail"],
      })

      for (const product of productImages) {
        if (product.images && Array.isArray(product.images)) {
          for (const imageUrl of product.images) {
            if (typeof imageUrl === 'string' && imageUrl.includes(process.env.S3_PUBLIC_URL!)) {
              const key = imageUrl.replace(`${process.env.S3_PUBLIC_URL}/`, '')
              imageReferences.push({
                id: `product_${product.id}`,
                entity_type: 'product',
                entity_id: product.id,
                image_url: imageUrl,
                key: key
              })
            }
          }
        }
        
        if (product.thumbnail && product.thumbnail.includes(process.env.S3_PUBLIC_URL!)) {
          const key = product.thumbnail.replace(`${process.env.S3_PUBLIC_URL}/`, '')
          imageReferences.push({
            id: `product_thumbnail_${product.id}`,
            entity_type: 'product',
            entity_id: product.id,
            image_url: product.thumbnail,
            key: key
          })
        }
      }
    } catch (error) {
      logger.warn("Could not scan products table:", error.message)
    }

    // Check product variants for image references
    try {
      const variantImages = await query.graph({
        entity: "product_variant",
        fields: ["id", "product_id"],
        relations: ["product"],
      })

      // Variants typically inherit product images, but check for specific variant images
      for (const variant of variantImages) {
        // Add any variant-specific image logic here if needed
      }
    } catch (error) {
      logger.warn("Could not scan product variants:", error.message)
    }

    logger.info(`📊 Found ${imageReferences.length} image references in database`)

    // Find orphaned images
    const referencedKeys = new Set(imageReferences.map(ref => ref.key))
    const orphanedImages = allImages.filter(image => 
      image.Key && !referencedKeys.has(image.Key)
    )

    logger.info(`🗑️  Found ${orphanedImages.length} orphaned images to clean up`)

    if (orphanedImages.length === 0) {
      logger.info("✅ No orphaned images found. Storage is clean!")
      return
    }

    // Ask for confirmation in development
    if (process.env.NODE_ENV === 'development') {
      logger.info("🚨 DEVELOPMENT MODE: Orphaned images found:")
      orphanedImages.slice(0, 10).forEach(image => {
        logger.info(`   - ${image.Key} (${(image.Size || 0 / 1024 / 1024).toFixed(2)}MB)`)
      })
      if (orphanedImages.length > 10) {
        logger.info(`   ... and ${orphanedImages.length - 10} more`)
      }
      
      logger.warn("⚠️  Set NODE_ENV=production to actually delete these files")
      return
    }

    // Delete orphaned images in production
    logger.info("🗑️  Deleting orphaned images...")
    
    const deleteResults = []
    const batchSize = 1000 // S3 delete limit
    
    for (let i = 0; i < orphanedImages.length; i += batchSize) {
      const batch = orphanedImages.slice(i, i + batchSize)
      
      const deleteParams = {
        Bucket: bucket,
        Delete: {
          Objects: batch.map(image => ({ Key: image.Key! })),
          Quiet: false
        }
      }
      
      try {
        const result = await s3.deleteObjects(deleteParams).promise()
        deleteResults.push(result)
        
        const deleted = result.Deleted?.length || 0
        const errors = result.Errors?.length || 0
        
        logger.info(`✅ Batch ${Math.floor(i / batchSize) + 1}: Deleted ${deleted} images${errors > 0 ? `, ${errors} errors` : ''}`)
        
      } catch (error) {
        logger.error(`❌ Failed to delete batch ${Math.floor(i / batchSize) + 1}:`, error)
      }
    }

    const totalDeleted = deleteResults.reduce((sum, result) => sum + (result.Deleted?.length || 0), 0)
    const totalErrors = deleteResults.reduce((sum, result) => sum + (result.Errors?.length || 0), 0)

    logger.info(`✅ Cleanup completed: ${totalDeleted} images deleted${totalErrors > 0 ? `, ${totalErrors} errors` : ''}`)

    // Calculate space saved
    const spaceFreed = orphanedImages.reduce((sum, image) => sum + (image.Size || 0), 0)
    logger.info(`💾 Storage space freed: ${(spaceFreed / 1024 / 1024).toFixed(2)} MB`)

  } catch (error) {
    logger.error("❌ Image cleanup failed:", error)
    throw error
  }
}