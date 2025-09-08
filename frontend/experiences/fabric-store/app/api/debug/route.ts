import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'not set',
      NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ? 'set (hidden)' : 'not set',
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'not set',
    },
    allEnvVars: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')).sort()
  })
}