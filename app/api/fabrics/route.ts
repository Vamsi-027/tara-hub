import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createFabric,
  getAllFabrics,
  initializeFabrics
} from '@/lib/fabric-kv'
import { revalidatePath, revalidateTag } from 'next/cache'

// Initialize fabrics on first request
let initialized = false

export async function GET(request: NextRequest) {
  try {
    // Initialize fabrics from seed data if not done
    if (!initialized) {
      await initializeFabrics()
      initialized = true
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const color = searchParams.get('color') || undefined
    const inStock = searchParams.get('inStock')

    const fabrics = await getAllFabrics({
      category,
      color,
      inStock: inStock ? inStock === 'true' : undefined
    })

    return NextResponse.json(fabrics)
  } catch (error) {
    console.error('Error fetching fabrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fabrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.category || !body.color) {
      return NextResponse.json(
        { error: 'Name, category, and color are required' },
        { status: 400 }
      )
    }

    const fabric = await createFabric(body)
    
    // Trigger ISR revalidation
    revalidatePath('/fabrics')
    revalidatePath(`/fabric/[id]`, 'page')
    revalidateTag('fabrics')
    
    return NextResponse.json(fabric, { status: 201 })
  } catch (error) {
    console.error('Error creating fabric:', error)
    return NextResponse.json(
      { error: 'Failed to create fabric' },
      { status: 500 }
    )
  }
}