import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
import { getAllFabrics, createFabric, updateFabric } from '@/src/modules/fabrics/services/fabric-kv.service'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract filter parameters
    const filters: any = {}
    
    // Map legacy filter names to new schema
    const category = searchParams.get('category')
    if (category) {
      filters.type = category // Map category -> type in new schema
    }
    
    const color = searchParams.get('color')
    if (color) {
      filters.primaryColor = color
    }
    
    const inStock = searchParams.get('inStock')
    if (inStock) {
      filters.hasStock = inStock === 'true'
    }
    
    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }

    // Get fabrics from KV store (simple legacy format)
    const fabrics = await getAllFabrics()
    
    // Apply filters if provided
    let filteredFabrics = fabrics
    
    if (category) {
      filteredFabrics = filteredFabrics.filter(f => f.category === category)
    }
    
    if (color) {
      filteredFabrics = filteredFabrics.filter(f => f.color === color)
    }
    
    if (inStock !== null) {
      filteredFabrics = filteredFabrics.filter(f => f.inStock === (inStock === 'true'))
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filteredFabrics = filteredFabrics.filter(f => 
        f.name.toLowerCase().includes(searchLower) ||
        f.description?.toLowerCase().includes(searchLower)
      )
    }

    return NextResponse.json(filteredFabrics)
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

    // Create fabric using KV service (simple format)
    const fabric = await createFabric({
      name: body.name,
      description: body.description,
      category: body.category,
      color: body.color,
      price: body.price || 0,
      inStock: body.inStock !== false,
      imageUrl: body.imageUrl
    })
    
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