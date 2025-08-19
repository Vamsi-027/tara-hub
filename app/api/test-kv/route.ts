import { NextResponse } from 'next/server'
import { kvClient } from '@/lib/kv-client'
import { checkJWTAuth, PERMISSIONS } from '@/lib/auth-utils-jwt'

export async function GET() {
  try {
    const { allowed, error } = await checkJWTAuth(PERMISSIONS.ADMIN_ONLY);
    if (!allowed) {
      return error!;
    }

    // Check if KV is configured
    const isConfigured = kvClient.isAvailable()
    
    if (!isConfigured) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'KV/Redis is not configured',
        required: {
          KV_REST_API_URL: 'Missing',
          KV_REST_API_TOKEN: 'Missing'
        }
      }, { status: 503 })
    }

    // Test basic operations
    const testKey = 'test:connection'
    const testValue = {
      timestamp: new Date().toISOString(),
      message: 'KV connection test successful'
    }

    // Test SET operation
    const setResult = await kvClient.set(testKey, testValue)
    
    // Test GET operation
    const getValue = await kvClient.get(testKey)
    
    // Test DELETE operation
    const deleteResult = await kvClient.del(testKey)

    return NextResponse.json({
      status: 'connected',
      message: 'KV/Redis connection successful',
      configuration: {
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'Configured' : 'Missing',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'Configured' : 'Missing',
        UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ? 'Configured' : 'Missing',
        UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ? 'Configured' : 'Missing',
      },
      testResults: {
        set: setResult ? 'Success' : 'Failed',
        get: getValue ? 'Success' : 'Failed',
        delete: deleteResult ? 'Success' : 'Failed',
        retrievedValue: getValue
      },
      endpoint: process.env.KV_REST_API_URL?.replace(/https?:\/\//, '').split('.')[0] || 'unknown'
    })
  } catch (error) {
    console.error('KV test error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test KV connection',
      error: String(error)
    }, { status: 500 })
  }
}