/**
 * Simple script to verify the S3 configuration is properly set
 */

const config = require("../medusa-config.ts")

console.log("🔍 Verifying S3 Configuration...")
console.log("=====================================")

// Get the actual config content
const actualConfig = typeof config === 'function' ? config : config.default || config

// Find the file module configuration
const fileModule = actualConfig.modules?.find((m: any) => m.resolve === "@medusajs/file")

if (!fileModule) {
  console.log("❌ File module not found in configuration")
  process.exit(1)
}

// Find the S3 provider
const s3Provider = fileModule.options.providers.find((p: any) => p.resolve === "@medusajs/file-s3")

if (!s3Provider) {
  console.log("❌ S3 provider not found in file module configuration")
  process.exit(1)
}

console.log("✅ S3 File Module Configuration:")
console.log(`   Provider: ${s3Provider.resolve}`)
console.log(`   Provider ID: ${s3Provider.id}`)
console.log(`   Endpoint: ${s3Provider.options.endpoint}`)
console.log(`   Bucket: ${s3Provider.options.bucket}`)
console.log(`   Prefix: ${s3Provider.options.prefix || '(none)'}`)
console.log(`   Force Path Style: ${s3Provider.options.s3ForcePathStyle}`)

if (s3Provider.options.prefix) {
  console.log("\n🎉 Organized prefix structure is configured!")
  console.log(`   All uploads will be prefixed with: ${s3Provider.options.prefix}`)
  console.log("   This means files will be stored in organized folders rather than the root")
} else {
  console.log("\n⚠️  No prefix configured - files will be stored in bucket root")
}

console.log("\n📋 Next Steps:")
console.log("   1. Upload a file through Medusa admin (http://localhost:9000/app)")
console.log("   2. Check Cloudflare R2 dashboard to verify the organized path structure")
console.log("   3. Verify CDN URLs work correctly with the new organized paths")