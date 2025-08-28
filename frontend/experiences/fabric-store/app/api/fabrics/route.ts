import { NextResponse } from 'next/server'

// Since we can't install pg directly due to package issues,
// we'll proxy through the Medusa backend or main app
export async function GET(request: Request) {
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
    
    // Option 2: Try Medusa backend with API key
    const medusaUrl = `http://localhost:9000/store/fabrics?limit=${limit}&offset=${offset}`
    const medusaResponse = await fetch(medusaUrl, {
      headers: {
        'x-publishable-api-key': 'pk_72f0a4f217ccf1a3912ac25acacbfb55dd513a997f2d9eb6125d29ffba2ef71c'
      }
    })
    
    if (medusaResponse.ok) {
      const data = await medusaResponse.json()
      return NextResponse.json(data)
    }
    
    // Option 3: Return mock data if both fail
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