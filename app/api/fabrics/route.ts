import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
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
    // Check authentication using custom JWT
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: { message: 'Unauthorized' } },
        { status: 401 }
      )
    }
    
    let user: any
    try {
      user = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any
      // Check if user has admin role
      if (!user.role || !['admin', 'super_admin', 'administrator'].includes(user.role.toLowerCase())) {
        return NextResponse.json(
          { error: { message: 'Insufficient permissions' } },
          { status: 403 }
        )
      }
    } catch (error) {
      console.error('JWT verification error:', error)
      return NextResponse.json(
        { error: { message: 'Invalid token' } },
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