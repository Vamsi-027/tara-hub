import { NextResponse } from 'next/server'
import { kvClient } from '@/lib/kv-client'

export async function GET() {
  try {
    // Check if KV is configured
    const isConfigured = kvClient.isAvailable()
    
    if (!isConfigured) {
      return NextResponse.json({
        status: 'not_configured',
        message: 'KV/Redis is not configured',
        env_check: {
          KV_REST_API_URL: !!process.env.KV_REST_API_URL,
          KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
        }
      })
    }

    // Test basic operations
    const testKey = 'public:test:connection'
    const timestamp = new Date().toISOString()
    const testValue = {
      timestamp,
      message: 'Redis connection test successful',
      endpoint: 'excited-emu-38074'
    }

    console.log('Testing Redis connection...')
    
    // Test SET operation
    const setResult = await kvClient.set(testKey, testValue)
    console.log('SET result:', setResult)
    
    // Test GET operation
    const getValue = await kvClient.get(testKey)
    console.log('GET result:', getValue)
    
    // Clean up test key
    await kvClient.del(testKey)

    return NextResponse.json({
      status: 'success',
      message: '✅ Redis connection successful!',
      redis_endpoint: 'excited-emu-38074.upstash.io',
      timestamp,
      test_results: {
        write: setResult ? '✅ Success' : '❌ Failed',
        read: getValue ? '✅ Success' : '❌ Failed',
        data_matched: getValue && (getValue as any).timestamp === timestamp ? '✅ Yes' : '❌ No'
      },
      configuration: {
        KV_REST_API_URL: process.env.KV_REST_API_URL ? '✅ Set' : '❌ Missing',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? '✅ Set' : '❌ Missing',
      }
    })
  } catch (error) {
    console.error('Redis test error:', error)
    return NextResponse.json({
      status: 'error',
      message: '❌ Redis connection failed',
      error: String(error),
      configuration: {
        KV_REST_API_URL: process.env.KV_REST_API_URL ? 'Set' : 'Missing',
        KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'Set' : 'Missing',
      }
    })
  }
}