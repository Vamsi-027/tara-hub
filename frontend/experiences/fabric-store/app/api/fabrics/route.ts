import { NextResponse } from 'next/server'
import { withCors } from '../../../lib/cors'
import { client } from '../../../lib/sanity'

// Since we can't install pg directly due to package issues,
// we'll proxy through the Medusa backend or main app
async function handleGET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'
    const page = searchParams.get('page') || '1'
    const category = searchParams.get('category') || ''
    const collection = searchParams.get('collection') || ''
    const color_family = searchParams.get('color_family') || ''
    const pattern = searchParams.get('pattern') || ''
    const search = searchParams.get('search') || ''
    
    // Option 1: Try Medusa backend - PRIMARY DATA SOURCE
    const medusaBackendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://medusa-backend-production-3655.up.railway.app'
    const medusaUrl = new URL(`${medusaBackendUrl}/store/products`)
    
    // Apply Medusa-compatible filters
    medusaUrl.searchParams.set('limit', limit)
    medusaUrl.searchParams.set('offset', offset)
    if (search) medusaUrl.searchParams.set('q', search)
    if (category) medusaUrl.searchParams.set('category_id[]', category)
    if (collection) medusaUrl.searchParams.set('collection_id[]', collection)
    
    const medusaPublishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'
    
    try {
      console.log('🔌 Connecting to Medusa backend at:', medusaUrl.toString())
      console.log('📋 Environment variables:', {
        MEDUSA_URL: medusaBackendUrl,
        HAS_PUBLISHABLE_KEY: !!medusaPublishableKey,
        ENV_VARS: Object.keys(process.env).filter(k => k.includes('MEDUSA')).reduce((acc, k) => ({...acc, [k]: process.env[k]}), {})
      })
      
      const medusaResponse = await fetch(medusaUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-publishable-api-key': medusaPublishableKey
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 seconds
      })
      
      if (medusaResponse.ok) {
        const data = await medusaResponse.json()
        console.log('✅ Successfully fetched from Medusa:', data.products?.length || 0, 'products')
        
        // Transform Medusa products to fabric format
        const transformedFabrics = data.products?.map((product: any) => ({
          id: product.id,
          name: product.title,
          sku: product.handle,
          description: product.description,
          category: product.type?.value || product.category?.name || 'Uncategorized',
          collection: product.collection?.title || '',
          price: product.variants?.[0]?.prices?.[0]?.amount ? (product.variants[0].prices[0].amount / 100) : 0,
          images: product.images?.map((img: any) => img.url) || [],
          swatch_image_url: product.thumbnail || product.images?.[0]?.url,
          status: product.status,
          color: product.metadata?.color || 'Unknown',
          color_family: product.metadata?.color_family || product.metadata?.color || 'Neutral',
          color_hex: product.metadata?.color_hex || '#94a3b8',
          pattern: product.metadata?.pattern || 'Solid',
          usage: product.metadata?.usage || 'Indoor',
          properties: product.tags?.map((tag: any) => tag.value) || [],
          composition: product.metadata?.composition || 'Not specified',
          width: product.metadata?.width || 'Not specified',
          weight: product.metadata?.weight || 'Not specified',
          durability: product.metadata?.durability || 'Not specified',
          care_instructions: product.metadata?.care_instructions || 'Not specified',
          in_stock: product.variants?.some((variant: any) => variant.inventory_quantity > 0) || false,
          stock_quantity: product.variants?.reduce((sum: number, variant: any) => sum + (variant.inventory_quantity || 0), 0) || 0,
          swatch_price: product.metadata?.swatch_price ? parseFloat(product.metadata.swatch_price) : 5.00,
          swatch_in_stock: product.metadata?.swatch_in_stock === 'true' || product.metadata?.swatch_in_stock === true,
          created_at: product.created_at,
          updated_at: product.updated_at
        })) || []
        
        return NextResponse.json({
          fabrics: transformedFabrics,
          count: transformedFabrics.length,
          totalCount: data.count || transformedFabrics.length,
          page: parseInt(page),
          totalPages: Math.ceil((data.count || transformedFabrics.length) / parseInt(limit)),
          offset: parseInt(offset),
          limit: parseInt(limit),
          source: 'medusa'
        })
      } else {
        console.log('⚠️ Medusa response not OK:', medusaResponse.status, medusaResponse.statusText)
        const errorText = await medusaResponse.text()
        console.log('Error details:', errorText)
      }
    } catch (error) {
      console.log('❌ Medusa API connection failed:', error)
    }
    
    // Option 2: Try Sanity CMS for fabric data
    try {
      console.log('🎨 Trying Sanity CMS for fabric data...')
      
      const sanityQuery = `
        *[_type == "fabric"] {
          _id,
          name,
          sku,
          category,
          collection,
          price,
          "images": images[].asset->url,
          "swatch_image_url": swatchImage.asset->url,
          status,
          description,
          color,
          color_family,
          color_hex,
          pattern,
          usage,
          properties,
          composition,
          width,
          weight,
          durability,
          care_instructions,
          in_stock
        }[0...${limit}]
      `
      
      const sanityFabrics = await client.fetch(sanityQuery)
      
      if (sanityFabrics && sanityFabrics.length > 0) {
        console.log('✅ Successfully fetched from Sanity:', sanityFabrics.length, 'fabrics')
        return NextResponse.json({
          fabrics: sanityFabrics.map((fabric: any) => ({
            id: fabric._id,
            name: fabric.name,
            sku: fabric.sku,
            category: fabric.category || '',
            collection: fabric.collection || '',
            price: fabric.price || 0,
            images: fabric.images || [],
            swatch_image_url: fabric.swatch_image_url,
            status: fabric.status || 'Active',
            description: fabric.description,
            color: fabric.color,
            color_family: fabric.color_family,
            color_hex: fabric.color_hex,
            pattern: fabric.pattern,
            usage: fabric.usage,
            properties: fabric.properties || [],
            composition: fabric.composition,
            width: fabric.width,
            weight: fabric.weight,
            durability: fabric.durability,
            care_instructions: fabric.care_instructions,
            in_stock: fabric.in_stock || false,
            swatch_price: 5.00,
            swatch_in_stock: true
          })),
          count: sanityFabrics.length,
          totalCount: sanityFabrics.length,
          page: parseInt(page),
          totalPages: Math.ceil(sanityFabrics.length / parseInt(limit)),
          offset: parseInt(offset),
          limit: parseInt(limit),
          source: 'sanity'
        })
      }
    } catch (error) {
      console.log('⚠️ Sanity CMS not available:', error)
    }
    
    // Option 3: Return mock data if all sources fail
    console.log('📝 Using fallback mock data')
    const mockFabrics = [
      {
        id: '1',
        name: 'Palisade Fountain',
        sku: 'PAL-FTN-001',
        category: 'Upholstery',
        collection: 'Palisade',
        price: 125.00,
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
        swatch_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        status: 'Active',
        description: 'Premium upholstery fabric from our Palisade collection',
        color: 'Blue',
        color_family: 'Blue',
        color_hex: '#3b82f6',
        pattern: 'Solid',
        usage: 'Indoor',
        properties: ['Water Resistant', 'Stain Resistant'],
        composition: '100% Polyester',
        width: '54 inches',
        weight: 'Medium',
        durability: '50,000 double rubs',
        care_instructions: 'Professional cleaning recommended',
        in_stock: true,
        swatch_price: 5.00,
        swatch_in_stock: true
      },
      {
        id: '2',
        name: 'Dash Snowy',
        sku: 'DSH-SNW-001',
        category: 'Drapery',
        collection: 'Dash',
        price: 95.00,
        images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
        swatch_image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        status: 'Active',
        description: 'Elegant drapery fabric with a subtle texture',
        color: 'White',
        color_family: 'Neutral',
        color_hex: '#f3f4f6',
        pattern: 'Textured',
        usage: 'Indoor',
        properties: ['Light Filtering', 'Washable'],
        composition: '60% Cotton, 40% Linen',
        width: '108 inches',
        weight: 'Light',
        durability: '30,000 double rubs',
        care_instructions: 'Machine washable cold',
        in_stock: true,
        swatch_price: 3.50,
        swatch_in_stock: true
      },
      {
        id: '3',
        name: 'Riverbed Blush',
        sku: 'RVB-BLS-001',
        category: 'Multipurpose',
        collection: 'Riverbed',
        price: 110.00,
        images: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400'],
        swatch_image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400',
        status: 'Active',
        description: 'Versatile fabric suitable for various applications',
        color: 'Pink',
        color_family: 'Pink',
        color_hex: '#ec4899',
        pattern: 'Geometric',
        usage: 'Both',
        properties: ['UV Resistant', 'Mildew Resistant'],
        composition: '100% Solution Dyed Acrylic',
        width: '54 inches',
        weight: 'Medium',
        durability: '60,000 double rubs',
        care_instructions: 'Spot clean with mild soap',
        in_stock: true,
        swatch_price: 4.75,
        swatch_in_stock: true
      }
    ]

    return NextResponse.json({
      fabrics: mockFabrics,
      count: mockFabrics.length,
      totalCount: mockFabrics.length,
      page: parseInt(page),
      totalPages: 1,
      offset: parseInt(offset),
      limit: parseInt(limit),
      source: 'mock',
      warning: 'Using mock data - check Medusa backend connection'
    })
    
  } catch (error) {
    console.error('💥 Error in fabrics API route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fabrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Export wrapped handlers with CORS
export const GET = withCors(handleGET)

// Handle preflight OPTIONS requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Max-Age': '86400',
    },
  })
}