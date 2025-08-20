import { NextResponse } from 'next/server'

// Proxy endpoint to fetch fabrics from admin app
// This avoids CORS issues when calling from browser
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    
    // Forward request to admin API
    const adminUrl = `http://localhost:3000/api/fabrics${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(adminUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      // If admin API is not available, return seed data as fallback
      const { fabricSeedData } = await import('@/lib/fabric-seed-data')
      return NextResponse.json(fabricSeedData)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch fabrics from admin:', error)
    // Return seed data as fallback
    const { fabricSeedData } = await import('@/lib/fabric-seed-data')
    return NextResponse.json(fabricSeedData)
  }
}