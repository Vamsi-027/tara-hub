import { NextResponse } from 'next/server'

// Helper function to get color hex from color name
function getColorHex(colorName: string | null): string | null {
  if (!colorName) return null
  const colors: Record<string, string> = {
    'red': '#DC143C',
    'blue': '#0000FF',
    'green': '#008000',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'black': '#000000',
    'white': '#FFFFFF',
    'gray': '#808080',
    'grey': '#808080',
    'beige': '#F5DEB3',
    'navy': '#000080',
    'teal': '#008080',
    'coral': '#FF7F50',
    'burgundy': '#800020',
    'olive': '#808000',
    'cream': '#FFFDD0',
    'gold': '#FFD700'
  }
  return colors[colorName.toLowerCase()] || null
}

// Helper function to extract pattern from description
function extractPattern(description: string | null): string | null {
  if (!description) return null
  const patterns = ['solid', 'striped', 'plaid', 'floral', 'geometric', 'abstract', 'textured', 'paisley', 'damask', 'herringbone']
  const desc = description.toLowerCase()
  for (const pattern of patterns) {
    if (desc.includes(pattern)) {
      return pattern.charAt(0).toUpperCase() + pattern.slice(1)
    }
  }
  return null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fabricId } = await params

    // Fetch from Medusa backend - ONLY DATA SOURCE
    const medusaBackendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://medusa-backend-production-3655.up.railway.app'
    const medusaPublishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

    // Dynamic region selection - use USD region for American customers
    const url = new URL(request.url)
    const regionParam = url.searchParams.get('region') || process.env.NEXT_PUBLIC_MEDUSA_DEFAULT_REGION || 'usd'
    let regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_EUR || 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN'

    // Use USD region if configured and not a placeholder
    if (regionParam === 'usd' &&
        process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_USD &&
        !process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_USD.includes('PLACEHOLDER')) {
      regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_USD
      console.log('🇺🇸 Using US region for pricing:', regionId)
    }

    // Use custom endpoint that includes metadata
    console.log(`🔌 Fetching product from Medusa: ${medusaBackendUrl}/store/products-with-metadata?id=${fabricId}`)
    console.log(`🌍 Using region: ${regionId} (${regionParam})`)

    const medusaResponse = await fetch(`${medusaBackendUrl}/store/products-with-metadata?id=${fabricId}&region_id=${regionId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-publishable-api-key': medusaPublishableKey
      },
      signal: AbortSignal.timeout(15000)
    })

    if (!medusaResponse.ok) {
      throw new Error(`Medusa API responded with ${medusaResponse.status}: ${medusaResponse.statusText}`)
    }

    const data = await medusaResponse.json()

    if (!data.product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const product = data.product

    // Find fabric and swatch variants with proper pricing
    const fabricVariant = product.variants?.find((v: any) =>
      v.title?.toLowerCase().includes('fabric') || v.title?.toLowerCase().includes('yard')
    )
    const swatchVariant = product.variants?.find((v: any) =>
      v.title?.toLowerCase().includes('swatch')
    )

    // Helper functions for fallback pricing - UPDATED with user's admin prices
    const getFallbackFabricPrice = (handle: string): number => {
      const h = handle.toLowerCase()
      const pricing: Record<string, number> = {
        'hf-vv33qkhd2': 530.00,  // Sandwell Lipstick - Updated by user to $530
        'hf-dnh5rt1pt': 85.00
      }
      if (pricing[h]) return pricing[h]
      if (h.includes('linen')) return 85.00
      if (h.includes('velvet')) return 180.00
      if (h.includes('silk')) return 225.00
      return 125.00
    }

    const getFallbackSwatchPrice = (handle: string): number => {
      const h = handle.toLowerCase()
      const pricing: Record<string, number> = {
        'hf-vv33qkhd2': 4.50,  // Sandwell Lipstick - Updated by user to $4.50
        'hf-dnh5rt1pt': 3.50
      }
      if (pricing[h]) return pricing[h]
      if (h.includes('silk')) return 8.00
      if (h.includes('velvet')) return 6.50
      if (h.includes('linen')) return 3.50
      return 5.00
    }

    // Extract pricing and inventory data - USD prices come in dollars format
    const fabricPrice = fabricVariant?.calculated_price?.calculated_amount || 0
    const swatchPrice = swatchVariant?.calculated_price?.calculated_amount || 0

    const fabricInStock = fabricVariant
      ? ((fabricVariant.inventory_quantity !== null ? fabricVariant.inventory_quantity : 50) > 0 || fabricVariant.allow_backorder === true)
      : false

    const swatchInStock = swatchVariant
      ? ((swatchVariant.inventory_quantity !== null ? swatchVariant.inventory_quantity : 100) > 0 || swatchVariant.allow_backorder === true)
      : false

    // Transform Medusa product to fabric format with accurate data
    const transformedFabric = {
      id: product.id,
      name: product.title || 'Untitled Fabric',
      sku: product.handle || product.id,
      description: product.description || '',
      category: product.type?.value || product.categories?.[0]?.name || 'Fabric',
      collection: product.collection?.title || '',

      // Accurate pricing from Medusa
      price: fabricPrice,
      swatch_price: swatchPrice,

      // Accurate inventory from Medusa
      in_stock: fabricInStock,
      swatch_in_stock: swatchInStock,
      stock_quantity: fabricVariant?.inventory_quantity !== null ? fabricVariant.inventory_quantity : 50,
      swatch_stock_quantity: swatchVariant?.inventory_quantity !== null ? swatchVariant.inventory_quantity : 100,

      // Media
      images: product.images?.map((img: any) => {
        // Handle different image URL formats
        if (typeof img.url === 'string') return img.url
        if (typeof img.url === 'object' && img.url.url) return img.url.url
        return img.url
      }).filter(Boolean) || [],
      swatch_image_url: product.thumbnail || product.images?.[0]?.url || '',

      // Product details - Now with proper metadata support
      color: product.metadata?.color || product.subtitle || 'Natural',
      color_family: product.metadata?.color_family || product.metadata?.color || product.subtitle || 'Natural',
      color_hex: product.metadata?.color_hex || getColorHex(product.metadata?.color || product.subtitle) || '#94a3b8',
      pattern: product.metadata?.pattern || extractPattern(product.description) || 'Solid',
      usage: product.metadata?.usage || 'Indoor',
      properties: product.tags?.map((tag: any) => tag.value) ||
                  (product.metadata?.properties ? product.metadata.properties.split(',').map((p: string) => p.trim()) : []),
      composition: product.material || product.metadata?.composition || 'Premium Fabric',
      width: product.metadata?.width || product.width || '54 inches',
      weight: product.metadata?.weight || product.weight || 'Medium',
      durability: product.metadata?.durability || '50,000 double rubs',
      care_instructions: product.metadata?.care_instructions || 'Professional cleaning recommended',

      // Metadata
      status: product.status || 'active',
      created_at: product.created_at,
      updated_at: product.updated_at,

      // Variants with accurate pricing and inventory
      variants: product.variants?.map((variant: any) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        type: variant.title?.toLowerCase().includes('swatch') ? 'Swatch' : 'Fabric',
        price: variant.calculated_price?.calculated_amount || 0,
        inventory_quantity: variant.inventory_quantity || 0,
        allow_backorder: variant.allow_backorder,
        manage_inventory: variant.manage_inventory,
        in_stock: (variant.inventory_quantity || 0) > 0 || variant.allow_backorder === true,
        options: variant.options
      })) || []
    }

    console.log('✅ Successfully transformed Medusa product:', transformedFabric.id, transformedFabric.name)
    return NextResponse.json({ fabric: transformedFabric })
    
  } catch (error) {
    console.error('Error fetching fabric:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fabric details' },
      { status: 500 }
    )
  }
}