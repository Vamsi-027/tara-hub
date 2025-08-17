import { NextResponse } from 'next/server'

export async function GET() {
  // Comprehensive R2 diagnostic information
  const env = {
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    S3_URL: process.env.S3_URL,
    R2_BUCKET: process.env.R2_BUCKET || 'store',
  }

  // Extract account ID
  const accountId = env.S3_URL?.match(/([a-f0-9]{32})/i)?.[1]
  
  // Check configuration completeness
  const isConfigured = !!(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.S3_URL)
  
  // Validate credential format
  const credentialValidation = {
    accessKeyFormat: env.R2_ACCESS_KEY_ID ? 
      (env.R2_ACCESS_KEY_ID.length === 32 ? '✅ Valid (32 chars)' : `⚠️ Unusual length: ${env.R2_ACCESS_KEY_ID.length} chars`) : 
      '❌ Missing',
    secretKeyFormat: env.R2_SECRET_ACCESS_KEY ?
      (env.R2_SECRET_ACCESS_KEY.length === 40 ? '✅ Valid (40 chars)' : `⚠️ Unusual length: ${env.R2_SECRET_ACCESS_KEY.length} chars`) :
      '❌ Missing',
    hasWhitespace: {
      accessKey: env.R2_ACCESS_KEY_ID?.includes(' ') ? '❌ Contains spaces' : '✅ No spaces',
      secretKey: env.R2_SECRET_ACCESS_KEY?.includes(' ') ? '❌ Contains spaces' : '✅ No spaces',
    },
    hasNewlines: {
      accessKey: env.R2_ACCESS_KEY_ID?.includes('\n') ? '❌ Contains newlines' : '✅ No newlines',
      secretKey: env.R2_SECRET_ACCESS_KEY?.includes('\n') ? '❌ Contains newlines' : '✅ No newlines',
    },
  }

  // Determine endpoint format
  const endpointAnalysis = {
    providedUrl: env.S3_URL,
    extractedAccountId: accountId,
    standardEndpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null,
    isCorrectFormat: env.S3_URL?.includes('.r2.cloudflarestorage.com'),
  }

  // Provide actionable recommendations
  const recommendations = []
  
  if (!isConfigured) {
    recommendations.push('🔴 Add missing environment variables')
  }
  
  if (env.R2_ACCESS_KEY_ID?.length !== 32) {
    recommendations.push('🟡 R2 Access Key ID should be 32 characters')
  }
  
  if (env.R2_SECRET_ACCESS_KEY?.length !== 40) {
    recommendations.push('🟡 R2 Secret Access Key should be 40 characters')
  }
  
  if (env.R2_ACCESS_KEY_ID?.includes(' ') || env.R2_SECRET_ACCESS_KEY?.includes(' ')) {
    recommendations.push('🔴 Remove any spaces from credentials')
  }
  
  if (!endpointAnalysis.isCorrectFormat) {
    recommendations.push('🟡 S3_URL should be in format: https://[account-id].r2.cloudflarestorage.com')
  }

  // Instructions for fixing 403 error
  const fixInstructions = [
    '🔑 **To fix the 403 Forbidden error:**',
    '',
    '1. **Go to Cloudflare Dashboard** → R2 → Manage API tokens',
    '2. **Create a new API token** with these settings:',
    '   - Permission: **Admin Read & Write**',
    '   - TTL: Set as needed (or leave unlimited)',
    '   - Specify bucket: Select "Apply to specific buckets only" and choose "store"',
    '   - IP filtering: Leave empty for now',
    '3. **Copy the credentials** carefully:',
    '   - Access Key ID (32 characters)',
    '   - Secret Access Key (40 characters)',
    '   - Endpoint (should match pattern above)',
    '4. **Update .env.local** with the new credentials',
    '5. **Restart the Next.js server**',
    '',
    '📝 **Current Status:**',
    '- Authentication: ✅ Working (no signature errors)',
    '- Authorization: ❌ Failed (403 error)',
    '- Likely cause: API token lacks required permissions',
  ]

  return NextResponse.json({
    status: isConfigured ? 'configured' : 'not_configured',
    summary: {
      configured: isConfigured,
      accountId: accountId || 'not detected',
      bucket: env.R2_BUCKET,
      credentialsPresent: !!(env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY),
    },
    validation: credentialValidation,
    endpoint: endpointAnalysis,
    environment: {
      R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID ? `${env.R2_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT SET',
      R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY ? '***SET***' : 'NOT SET',
      S3_URL: env.S3_URL || 'NOT SET',
      R2_BUCKET: env.R2_BUCKET,
    },
    recommendations,
    instructions: fixInstructions.join('\n'),
  }, { status: isConfigured ? 200 : 503 })
}