import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
import {
  getFabric,
  updateFabric,
  deleteFabric
} from '@/lib/fabric-kv'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fabric = await getFabric(params.id)
    
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
      { error: 'Failed to fetch fabric' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const fabric = await updateFabric(params.id, body)
    
    if (!fabric) {
      return NextResponse.json(
        { error: 'Fabric not found' },
        { status: 404 }
      )
    }
    
    // Trigger ISR revalidation
    revalidatePath('/fabrics')
    revalidatePath(`/fabric/${params.id}`)
    revalidateTag('fabrics')
    revalidateTag(`fabric-${params.id}`)
    
    return NextResponse.json(fabric)
  } catch (error) {
    console.error('Error updating fabric:', error)
    return NextResponse.json(
      { error: 'Failed to update fabric' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const success = await deleteFabric(params.id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Fabric not found' },
        { status: 404 }
      )
    }
    
    // Trigger ISR revalidation
    revalidatePath('/fabrics')
    revalidateTag('fabrics')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting fabric:', error)
    return NextResponse.json(
      { error: 'Failed to delete fabric' },
      { status: 500 }
    )
  }
}