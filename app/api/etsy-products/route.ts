import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EtsyProductModel } from '@/lib/etsy-product-model'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured') === 'true'
    
    const products = featured 
      ? await EtsyProductModel.findFeatured()
      : await EtsyProductModel.findAll()
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching Etsy products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const product = await EtsyProductModel.create(body)
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating Etsy product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}