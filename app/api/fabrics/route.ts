import { NextResponse } from 'next/server'

// Direct database connection for fabrics
export async function GET(request: Request) {
  try {
    // Use pg module if available, otherwise use mock data
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Try to import pg dynamically
    try {
      const { Client } = await import('pg')
      
      const client = new Client({
        connectionString: process.env.POSTGRES_URL_NON_POOLING || 
                         process.env.DATABASE_URL || 
                         process.env.POSTGRES_URL,
        ssl: {
          rejectUnauthorized: false
        }
      })
      
      await client.connect()
      
      // Get total count
      const countResult = await client.query('SELECT COUNT(*) FROM fabrics')
      const totalCount = parseInt(countResult.rows[0].count)
      
      // Get fabrics with pagination
      const fabricsResult = await client.query(`
        SELECT 
          id, name, sku, category, collection, pattern, color_family,
          price, width, weight, content, durability_rating, 
          treatment, usage_type, in_stock, status, images,
          created_at, updated_at
        FROM fabrics 
        WHERE status = 'Active'
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `, [limit, offset])
      
      await client.end()
      
      return NextResponse.json({
        fabrics: fabricsResult.rows.map(fabric => ({
          ...fabric,
          images: fabric.images || ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400']
        })),
        count: totalCount,
        offset,
        limit
      })
      
    } catch (dbError) {
      console.log('Database connection not available, returning sample data')
      
      // Return sample data if database is not available
      return NextResponse.json({
        fabrics: [
          {
            id: '1',
            name: 'Palisade Fountain',
            sku: 'PAL-FTN-001',
            category: 'Upholstery',
            collection: 'Palisade',
            color_family: 'Blue',
            pattern: 'Solid',
            price: 125.00,
            width: 54,
            weight: 'Medium',
            content: '100% Polyester',
            durability_rating: 50000,
            treatment: 'Stain Resistant',
            usage_type: 'Residential',
            in_stock: true,
            status: 'Active',
            images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
            description: 'Premium upholstery fabric from our Palisade collection'
          },
          {
            id: '2', 
            name: 'Dash Snowy',
            sku: 'DSH-SNW-001',
            category: 'Drapery',
            collection: 'Dash',
            color_family: 'White',
            pattern: 'Textured',
            price: 95.00,
            width: 108,
            weight: 'Light',
            content: '60% Cotton, 40% Linen',
            durability_rating: 30000,
            treatment: 'None',
            usage_type: 'Residential',
            in_stock: true,
            status: 'Active',
            images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'],
            description: 'Elegant drapery fabric with a subtle texture'
          },
          {
            id: '3',
            name: 'Riverbed Blush',
            sku: 'RVB-BLS-001',
            category: 'Multipurpose',
            collection: 'Riverbed',
            color_family: 'Pink',
            pattern: 'Geometric',
            price: 110.00,
            width: 54,
            weight: 'Medium',
            content: '100% Solution Dyed Acrylic',
            durability_rating: 60000,
            treatment: 'Water Resistant',
            usage_type: 'Indoor/Outdoor',
            in_stock: true,
            status: 'Active',
            images: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400'],
            description: 'Versatile fabric suitable for various applications'
          }
        ],
        count: 3,
        offset: 0,
        limit: 50,
        source: 'mock'
      })
    }
    
  } catch (error) {
    console.error('Error in fabrics API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fabrics' },
      { status: 500 }
    )
  }
}