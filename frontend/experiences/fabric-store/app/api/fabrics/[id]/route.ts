import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fabricId } = await params
    
    // Try to fetch from fabric API server (port 3010) - REAL DATABASE DATA
    try {
      const response = await fetch(`http://localhost:3010/api/fabrics/${fabricId}`)
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.log('Fabric API not available, trying fallback...')
    }
    
    // Option 2: Try Medusa backend with API key
    const medusaResponse = await fetch(`http://localhost:9000/store/fabrics/${fabricId}`, {
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
      fabric: {
        id: fabricId,
        name: 'Sample Fabric',
        sku: 'SAMPLE-001',
        category: 'Upholstery',
        collection: 'Sample Collection',
        price: 125.00,
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
        ],
        swatch_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        status: 'Active',
        description: 'A premium upholstery fabric perfect for furniture and interior design projects. Features excellent durability and a luxurious feel.',
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
        brand: 'Premium Fabrics',
        colors: ['#3b82f6', '#1e40af', '#60a5fa'],
        stock_unit: 'yard'
      }
    })
    
  } catch (error) {
    console.error('Error fetching fabric:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fabric details' },
      { status: 500 }
    )
  }
}