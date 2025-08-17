import { NextResponse } from 'next/server'

export async function GET() {
  // Check environment variables
  const config = {
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    S3_URL: process.env.S3_URL,
    R2_BUCKET: process.env.R2_BUCKET,
  }

  // Check if all required vars are present
  const isConfigured = !!(config.R2_ACCESS_KEY_ID && config.R2_SECRET_ACCESS_KEY && config.S3_URL)

  // Extract account ID from URL if present
  const accountId = config.S3_URL?.match(/([a-f0-9]{32})/)?.[1]

  return NextResponse.json({
    status: isConfigured ? 'configured' : 'not_configured',
    environment: {
      R2_ACCESS_KEY_ID: config.R2_ACCESS_KEY_ID ? `${config.R2_ACCESS_KEY_ID.substring(0, 10)}...` : 'NOT SET',
      R2_SECRET_ACCESS_KEY: config.R2_SECRET_ACCESS_KEY ? '***SET***' : 'NOT SET',
      S3_URL: config.S3_URL || 'NOT SET',
      R2_BUCKET: config.R2_BUCKET || 'NOT SET',
    },
    details: {
      accountId: accountId || 'unknown',
      endpoint: config.S3_URL,
      bucket: config.R2_BUCKET,
      keyLength: config.R2_ACCESS_KEY_ID?.length,
      secretLength: config.R2_SECRET_ACCESS_KEY?.length,
    },
    recommendation: isConfigured 
      ? 'Configuration looks correct. If getting signature errors, verify the secret key has no trailing spaces.'
      : 'Please set all required R2 environment variables.'
  })
}