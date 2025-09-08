import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fabricId } = await params
    
    // Option 1: Try Medusa backend - PRIMARY DATA SOURCE
    const medusaBackendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
    try {
      console.log(`Trying Medusa backend at: ${medusaBackendUrl}/store/products/${fabricId}`)
      const medusaResponse = await fetch(`${medusaBackendUrl}/store/products/${fabricId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'
        }
      })
      
      if (medusaResponse.ok) {
        const data = await medusaResponse.json()
        
        // Transform Medusa product to fabric format
        if (data.product) {
          const product = data.product
          const transformedFabric = {
            id: product.id,
            name: product.title,
            sku: product.variants?.[0]?.sku || product.handle,
            description: product.description,
            category: product.categories?.[0]?.name || product.type?.value || 'Fabric',
            collection: product.collection?.title || product.collection_id || null,
            price: product.variants?.find(v => v.title?.includes('Fabric'))?.calculated_price?.calculated_amount ? 
                   (product.variants.find(v => v.title?.includes('Fabric')).calculated_price.calculated_amount / 100) : 
                   125.00,
            swatch_price: product.variants?.find(v => v.title?.includes('Swatch'))?.calculated_price?.calculated_amount ? 
                         (product.variants.find(v => v.title?.includes('Swatch')).calculated_price.calculated_amount / 100) : 
                         5.00,
            swatch_in_stock: product.variants?.some(v => v.title?.includes('Swatch') && v.inventory_quantity > 0),
            in_stock: product.variants?.some(v => v.title?.includes('Fabric') && v.inventory_quantity > 0),
            images: product.images?.map(img => img.url) || [],
            swatch_image_url: product.thumbnail || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            color: product.subtitle || 'Natural',
            color_family: product.subtitle || 'Natural',
            color_hex: '#8B4513',
            pattern: 'Solid',
            usage: 'Indoor',
            properties: ['Premium Quality'],
            composition: product.material || '100% Premium Fabric',
            width: product.width || '54 inches',
            weight: product.weight || 'Medium',
            durability: '50,000 double rubs',
            care_instructions: 'Professional cleaning recommended',
            variants: product.variants,
            created_at: product.created_at,
            updated_at: product.updated_at
          }
          
          return NextResponse.json({ fabric: transformedFabric })
        }
        
        return NextResponse.json(data)
      } else {
        console.log('Medusa response not OK:', medusaResponse.status, medusaResponse.statusText)
      }
    } catch (error) {
      console.log('Medusa API not available:', error)
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
        swatch_price: 5.00,
        swatch_in_stock: true,
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
        stock_unit: 'yard',
        swatch_size: '4x4 inches',
        minimum_order_yards: '1',
        variants: [
          {
            id: 'variant-swatch',
            title: 'Swatch Sample',
            sku: 'SAMPLE-001-SWATCH',
            type: 'Swatch' as const,
            price: 5,
            inventory_quantity: 100,
            in_stock: true
          },
          {
            id: 'variant-fabric',
            title: 'Fabric Per Yard',
            sku: 'SAMPLE-001-YARD',
            type: 'Fabric' as const,
            price: 125,
            inventory_quantity: 50,
            in_stock: true
          }
        ]
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