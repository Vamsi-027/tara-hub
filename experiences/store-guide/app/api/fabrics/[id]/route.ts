import { NextResponse } from 'next/server'
import { getFabricById } from '@/modules/fabrics/data/seed-data'

interface Context {
  params: Promise<{
    id: string
  }>
}

export async function GET(
  request: Request,
  context: Context
) {
  try {
    const { id } = await context.params
    
    // Try to fetch from admin API first
    try {
      const response = await fetch(`http://localhost:3000/api/fabrics/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.error('Failed to fetch from admin API:', error)
    }

    // Fallback to seed data
    const fabric = getFabricById(id)
    
    if (!fabric) {
      return NextResponse.json(
        { error: 'Fabric not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(fabric)
  } catch (error) {
    console.error('Error fetching fabric:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}