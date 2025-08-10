import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
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