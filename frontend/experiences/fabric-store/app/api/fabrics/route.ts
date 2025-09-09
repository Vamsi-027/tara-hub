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
    const usage = searchParams.get('usage') || ''
    const sort_field = searchParams.get('sort_field') || 'name'
    const sort_direction = searchParams.get('sort_direction') || 'asc'
    const min_price = searchParams.get('min_price') || ''
    const max_price = searchParams.get('max_price') || ''
    const in_stock = searchParams.get('in_stock') || ''
    
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
    let mockFabrics = [
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
        swatch_in_stock: true,
        created_at: '2024-01-15T10:00:00Z'
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
        swatch_in_stock: true,
        created_at: '2024-02-01T14:30:00Z'
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
        swatch_in_stock: true,
        created_at: '2024-01-20T09:15:00Z'
      },
      {
        id: '4',
        name: 'Emerald Dreams',
        sku: 'EMR-DRM-001',
        category: 'Velvet',
        collection: 'Luxury',
        price: 180.00,
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
        swatch_image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        status: 'Active',
        description: 'Luxurious velvet fabric with rich texture',
        color: 'Green',
        color_family: 'Green',
        color_hex: '#22c55e',
        pattern: 'Solid',
        usage: 'Indoor',
        properties: ['Luxury', 'Premium'],
        composition: '100% Cotton Velvet',
        width: '54 inches',
        weight: 'Heavy',
        durability: '40,000 double rubs',
        care_instructions: 'Dry clean only',
        in_stock: true,
        swatch_price: 6.50,
        swatch_in_stock: true,
        created_at: '2024-03-01T16:45:00Z'
      },
      {
        id: '5',
        name: 'Sunset Canvas',
        sku: 'SST-CNV-001',
        category: 'Outdoor',
        collection: 'Weather Pro',
        price: 75.00,
        images: ['https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=400'],
        swatch_image_url: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=400',
        status: 'Active',
        description: 'Weather-resistant outdoor fabric',
        color: 'Orange',
        color_family: 'Orange',
        color_hex: '#fb923c',
        pattern: 'Striped',
        usage: 'Outdoor',
        properties: ['Weather Resistant', 'UV Protection'],
        composition: '100% Solution Dyed Acrylic',
        width: '60 inches',
        weight: 'Medium',
        durability: '70,000 double rubs',
        care_instructions: 'Machine washable',
        in_stock: false,
        swatch_price: 4.00,
        swatch_in_stock: true,
        created_at: '2024-02-15T11:20:00Z'
      },
      {
        id: '6',
        name: 'Charcoal Classic',
        sku: 'CHR-CLS-001',
        category: 'Linen',
        collection: 'Essential',
        price: 65.00,
        images: ['https://images.unsplash.com/photo-1595085092160-654baef2ca6e?w=400'],
        swatch_image_url: 'https://images.unsplash.com/photo-1595085092160-654baef2ca6e?w=400',
        status: 'Active',
        description: 'Classic linen fabric in charcoal grey',
        color: 'Gray',
        color_family: 'Gray',
        color_hex: '#6b7280',
        pattern: 'Solid',
        usage: 'Indoor',
        properties: ['Natural', 'Breathable'],
        composition: '100% Linen',
        width: '55 inches',
        weight: 'Light',
        durability: '25,000 double rubs',
        care_instructions: 'Machine washable warm',
        in_stock: true,
        swatch_price: 3.00,
        swatch_in_stock: true,
        created_at: '2024-01-10T08:30:00Z'
      }
    ]

    // Apply filters to mock data
    if (search) {
      const searchLower = search.toLowerCase()
      mockFabrics = mockFabrics.filter(fabric => 
        fabric.name.toLowerCase().includes(searchLower) ||
        fabric.sku.toLowerCase().includes(searchLower) ||
        fabric.category.toLowerCase().includes(searchLower) ||
        fabric.color.toLowerCase().includes(searchLower) ||
        fabric.description.toLowerCase().includes(searchLower)
      )
    }

    if (category) {
      mockFabrics = mockFabrics.filter(fabric => fabric.category === category)
    }

    if (collection) {
      mockFabrics = mockFabrics.filter(fabric => fabric.collection === collection)
    }

    if (color_family) {
      mockFabrics = mockFabrics.filter(fabric => fabric.color_family === color_family)
    }

    if (pattern) {
      mockFabrics = mockFabrics.filter(fabric => fabric.pattern === pattern)
    }

    if (usage) {
      mockFabrics = mockFabrics.filter(fabric => fabric.usage === usage)
    }

    if (in_stock === 'true') {
      mockFabrics = mockFabrics.filter(fabric => fabric.in_stock === true)
    } else if (in_stock === 'false') {
      mockFabrics = mockFabrics.filter(fabric => fabric.in_stock === false)
    }

    if (min_price) {
      mockFabrics = mockFabrics.filter(fabric => fabric.price >= parseFloat(min_price))
    }

    if (max_price) {
      mockFabrics = mockFabrics.filter(fabric => fabric.price <= parseFloat(max_price))
    }

    // Apply sorting
    mockFabrics.sort((a, b) => {
      let aVal, bVal
      
      switch (sort_field) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'price':
          aVal = a.price
          bVal = b.price
          break
        case 'created_at':
          aVal = new Date(a.created_at).getTime()
          bVal = new Date(b.created_at).getTime()
          break
        case 'category':
          aVal = a.category.toLowerCase()
          bVal = b.category.toLowerCase()
          break
        default:
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
      }

      if (sort_direction === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      }
    })

    // Apply pagination
    const startIndex = parseInt(offset)
    const endIndex = startIndex + parseInt(limit)
    const paginatedFabrics = mockFabrics.slice(startIndex, endIndex)

    return NextResponse.json({
      fabrics: paginatedFabrics,
      count: paginatedFabrics.length,
      totalCount: mockFabrics.length,
      page: parseInt(page),
      totalPages: Math.ceil(mockFabrics.length / parseInt(limit)),
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