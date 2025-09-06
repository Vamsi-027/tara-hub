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
    const category = searchParams.get('category') || ''
    const collection = searchParams.get('collection') || ''
    const color_family = searchParams.get('color_family') || ''
    const pattern = searchParams.get('pattern') || ''
    
    // Try to fetch from fabric API server (port 3010) - REAL DATABASE DATA
    const fabricApiUrl = new URL('http://localhost:3010/api/fabrics')
    fabricApiUrl.searchParams.set('limit', limit)
    fabricApiUrl.searchParams.set('offset', offset)
    if (category) fabricApiUrl.searchParams.set('category', category)
    if (collection) fabricApiUrl.searchParams.set('collection', collection)
    if (color_family) fabricApiUrl.searchParams.set('color_family', color_family)
    if (pattern) fabricApiUrl.searchParams.set('pattern', pattern)
    
    try {
      const response = await fetch(fabricApiUrl.toString())
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Fabric API not available, trying fallback...')
    }
    
    // Option 2: Try Medusa backend - PRIMARY DATA SOURCE
    const medusaBackendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
    const medusaUrl = new URL(`${medusaBackendUrl}/store/products`)
    medusaUrl.searchParams.set('limit', limit)
    medusaUrl.searchParams.set('offset', offset)
    if (category) medusaUrl.searchParams.set('category', category)
    if (collection) medusaUrl.searchParams.set('collection', collection)
    if (color_family) medusaUrl.searchParams.set('color_family', color_family)
    if (pattern) medusaUrl.searchParams.set('pattern', pattern)
    
    try {
      console.log('Trying Medusa backend at:', medusaUrl.toString())
      const medusaResponse = await fetch(medusaUrl.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'
        }
      })
      
      if (medusaResponse.ok) {
        const data = await medusaResponse.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Medusa API not available, trying fallback...')
    }
    
    // Option 3: Try Sanity CMS for fabric data
    try {
      console.log('Trying Sanity CMS for fabric data...')
      
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
            in_stock: fabric.in_stock || false
          })),
          total: sanityFabrics.length,
          source: 'sanity',
          offset: parseInt(offset),
          limit: parseInt(limit)
        })
      }
    } catch (error) {
      console.log('Sanity CMS not available, using fallback data...')
    }
    
    // Option 4: Return mock data if all sources fail
    return NextResponse.json({
      fabrics: [
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
          in_stock: true
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
          in_stock: true
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
          in_stock: true
        }
      ],
      count: 3,
      offset: 0,
      limit: 50
    })
    
  } catch (error) {
    console.error('Error fetching fabrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fabrics' },
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