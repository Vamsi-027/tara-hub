import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
import { fabricService } from '@/lib/services/fabric.service'
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

    // Get real fabrics from admin database
    const result = await fabricService.search(
      filters,
      { field: 'createdAt', direction: 'desc' },
      { page: 1, limit: 100 } // Reasonable limit for public API
    )

    // Transform to legacy format for backward compatibility
    const legacyFabrics = result.data.map(fabric => ({
      id: fabric.id,
      name: fabric.name,
      description: fabric.description,
      category: fabric.type, // Map type -> category for legacy
      color: fabric.primaryColor,
      price: fabric.retailPrice,
      inStock: (fabric.availableQuantity || 0) > 0,
      imageUrl: fabric.mainImageUrl,
      // Include some enhanced fields for better UX
      isStainResistant: fabric.isStainResistant,
      isPetFriendly: fabric.isPetFriendly,
      isOutdoorSafe: fabric.isOutdoorSafe,
      durabilityRating: fabric.durabilityRating,
      material: fabric.primaryMaterial,
      width: fabric.width,
      retailPrice: fabric.retailPrice,
      status: fabric.status
    }))

    return NextResponse.json(legacyFabrics)
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

    // Create fabric using the v1 service (but transform from legacy format)
    const fabricData = {
      sku: body.sku || `FAB-${Date.now()}`,
      name: body.name,
      description: body.description,
      type: body.category || 'Upholstery', // Map category -> type
      primaryColor: body.color,
      retailPrice: body.price || 0,
      stockQuantity: body.stockQuantity || 0,
      status: 'Active',
      isActive: true
    }
    
    const fabric = await fabricService.create(fabricData, user.userId || 'legacy-api')
    
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