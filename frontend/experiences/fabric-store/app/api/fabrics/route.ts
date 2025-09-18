import { NextResponse } from 'next/server'
import { withCors } from '../../../lib/cors'
import { client } from '../../../lib/sanity'

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

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface FabricFilter {
  // Text search
  search?: string
  
  // Category & Collection
  category?: string | string[]
  collection?: string | string[]
  
  // Color filters  
  color?: string | string[]
  color_family?: string | string[]
  color_hex?: string | string[]
  
  // Pattern & Usage
  pattern?: string | string[]
  usage?: string | string[]
  
  // Properties (array-based filtering)
  properties?: string | string[]
  
  // Material & Specs
  composition?: string | string[]
  durability?: string | string[]
  care_instructions?: string | string[]
  
  // Stock filters
  in_stock?: boolean | string
  swatch_in_stock?: boolean | string
  swatch_available?: boolean | string
  
  // Price ranges
  min_price?: number | string
  max_price?: number | string
  min_swatch_price?: number | string
  max_swatch_price?: number | string
  
  // Date filters
  created_after?: string
  created_before?: string
  updated_after?: string
  updated_before?: string
}

interface SortOptions {
  sort_field?: 'name' | 'price' | 'swatch_price' | 'created_at' | 'updated_at' | 'category' | 'collection'
  sort_direction?: 'asc' | 'desc'
}

interface PaginationOptions {
  page?: number | string
  limit?: number | string
  offset?: number | string
}

interface FilterMetadata {
  categories: Array<{ value: string; count: number }>
  collections: Array<{ value: string; count: number }>
  colors: Array<{ value: string; count: number }>
  color_families: Array<{ value: string; count: number }>
  patterns: Array<{ value: string; count: number }>
  usages: Array<{ value: string; count: number }>
  properties: Array<{ value: string; count: number }>
  compositions: Array<{ value: string; count: number }>
  durabilities: Array<{ value: string; count: number }>
  care_instructions: Array<{ value: string; count: number }>
  price_range: { min: number; max: number }
  swatch_price_range: { min: number; max: number }
  total_count: number
  in_stock_count: number
  swatch_available_count: number
}

// ==========================================
// VALIDATION UTILITIES
// ==========================================

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

function validatePagination(page: any, limit: any, offset: any) {
  const pageNum = parseInt(page) || 1
  const limitNum = parseInt(limit) || 12
  const offsetNum = parseInt(offset) || ((pageNum - 1) * limitNum)
  
  if (pageNum < 1) throw new ValidationError('Page must be >= 1')
  if (limitNum < 1 || limitNum > 100) throw new ValidationError('Limit must be between 1 and 100')
  if (offsetNum < 0) throw new ValidationError('Offset must be >= 0')
  
  return { page: pageNum, limit: limitNum, offset: offsetNum }
}

function validateSorting(sortField: any, sortDirection: any): SortOptions {
  const validSortFields = ['name', 'price', 'swatch_price', 'created_at', 'updated_at', 'category', 'collection']
  const validSortDirections = ['asc', 'desc']
  
  const field = sortField || 'name'
  const direction = sortDirection || 'asc'
  
  if (!validSortFields.includes(field)) {
    throw new ValidationError(`Invalid sort_field. Must be one of: ${validSortFields.join(', ')}`)
  }
  
  if (!validSortDirections.includes(direction)) {
    throw new ValidationError(`Invalid sort_direction. Must be one of: ${validSortDirections.join(', ')}`)
  }
  
  return { sort_field: field as any, sort_direction: direction as any }
}

function validatePriceRange(min: any, max: any): { min?: number; max?: number } {
  const result: { min?: number; max?: number } = {}
  
  if (min !== undefined && min !== null && min !== '') {
    const minNum = parseFloat(min)
    if (isNaN(minNum) || minNum < 0) throw new ValidationError('min_price must be a non-negative number')
    result.min = minNum
  }
  
  if (max !== undefined && max !== null && max !== '') {
    const maxNum = parseFloat(max)
    if (isNaN(maxNum) || maxNum <= 0) throw new ValidationError('max_price must be a positive number')
    result.max = maxNum
  }
  
  if (result.min !== undefined && result.max !== undefined && result.min > result.max) {
    throw new ValidationError('min_price cannot be greater than max_price')
  }
  
  return result
}

function validateDateRange(date: any, fieldName: string): Date | undefined {
  if (!date) return undefined
  
  const parsedDate = new Date(date)
  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid ISO date string`)
  }
  
  return parsedDate
}

function normalizeArrayParam(param: string | string[] | undefined): string[] {
  if (!param) return []
  if (Array.isArray(param)) return param
  return param.split(',').map(s => s.trim()).filter(Boolean)
}

function parseBooleanParam(param: any): boolean | undefined {
  if (param === undefined || param === null || param === '') return undefined
  
  // Handle string values
  if (typeof param === 'string') {
    const normalized = param.toLowerCase().trim()
    if (normalized === 'true' || normalized === '1') return true
    if (normalized === 'false' || normalized === '0') return false
    return undefined // Return undefined for invalid boolean strings instead of throwing
  }
  
  // Handle boolean values
  if (typeof param === 'boolean') return param
  
  // Handle numeric values (1 = true, 0 = false)
  if (typeof param === 'number') {
    if (param === 1) return true
    if (param === 0) return false
  }
  
  return undefined // Return undefined for unknown values instead of throwing
}

// ==========================================
// FILTERING UTILITIES
// ==========================================

function applyFilters(fabrics: any[], filters: FabricFilter): any[] {
  let filtered = [...fabrics]
  
  // Text search across multiple fields
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    filtered = filtered.filter(fabric => 
      fabric.name?.toLowerCase().includes(searchTerm) ||
      fabric.sku?.toLowerCase().includes(searchTerm) ||
      fabric.description?.toLowerCase().includes(searchTerm) ||
      fabric.category?.toLowerCase().includes(searchTerm) ||
      fabric.collection?.toLowerCase().includes(searchTerm) ||
      fabric.color?.toLowerCase().includes(searchTerm) ||
      fabric.composition?.toLowerCase().includes(searchTerm)
    )
  }
  
  // Category filter (supports multiple)
  if (filters.category && filters.category.length > 0) {
    const categories = normalizeArrayParam(filters.category as any)
    filtered = filtered.filter(fabric => 
      categories.some(cat => fabric.category?.toLowerCase() === cat.toLowerCase())
    )
  }
  
  // Collection filter (supports multiple)
  if (filters.collection && filters.collection.length > 0) {
    const collections = normalizeArrayParam(filters.collection as any)
    filtered = filtered.filter(fabric => 
      collections.some(col => fabric.collection?.toLowerCase() === col.toLowerCase())
    )
  }
  
  // Color filters
  if (filters.color && filters.color.length > 0) {
    const colors = normalizeArrayParam(filters.color as any)
    filtered = filtered.filter(fabric => 
      colors.some(color => fabric.color?.toLowerCase() === color.toLowerCase())
    )
  }
  
  if (filters.color_family && filters.color_family.length > 0) {
    const colorFamilies = normalizeArrayParam(filters.color_family as any)
    filtered = filtered.filter(fabric => 
      colorFamilies.some(family => fabric.color_family?.toLowerCase() === family.toLowerCase())
    )
  }
  
  if (filters.color_hex && filters.color_hex.length > 0) {
    const hexColors = normalizeArrayParam(filters.color_hex as any)
    filtered = filtered.filter(fabric => 
      hexColors.some(hex => fabric.color_hex?.toLowerCase() === hex.toLowerCase())
    )
  }
  
  // Pattern filter (supports multiple)
  if (filters.pattern && filters.pattern.length > 0) {
    const patterns = normalizeArrayParam(filters.pattern as any)
    filtered = filtered.filter(fabric => 
      patterns.some(pattern => fabric.pattern?.toLowerCase() === pattern.toLowerCase())
    )
  }
  
  // Usage filter (supports multiple)
  if (filters.usage && filters.usage.length > 0) {
    const usages = normalizeArrayParam(filters.usage as any)
    filtered = filtered.filter(fabric => 
      usages.some(usage => fabric.usage?.toLowerCase() === usage.toLowerCase())
    )
  }
  
  // Properties filter (array intersection)
  if (filters.properties && filters.properties.length > 0) {
    const requiredProperties = normalizeArrayParam(filters.properties as any)
    filtered = filtered.filter(fabric => {
      const fabricProperties = Array.isArray(fabric.properties) ? fabric.properties : []
      return requiredProperties.some(prop => 
        fabricProperties.some((fp: string) => fp.toLowerCase().includes(prop.toLowerCase()))
      )
    })
  }
  
  // Composition filter (supports multiple, partial matching)
  if (filters.composition && filters.composition.length > 0) {
    const compositions = normalizeArrayParam(filters.composition as any)
    filtered = filtered.filter(fabric => 
      compositions.some(comp => fabric.composition?.toLowerCase().includes(comp.toLowerCase()))
    )
  }
  
  // Durability filter
  if (filters.durability && filters.durability.length > 0) {
    const durabilities = normalizeArrayParam(filters.durability as any)
    filtered = filtered.filter(fabric => 
      durabilities.some(dur => fabric.durability?.toLowerCase().includes(dur.toLowerCase()))
    )
  }
  
  // Care instructions filter
  if (filters.care_instructions && filters.care_instructions.length > 0) {
    const careInstructions = normalizeArrayParam(filters.care_instructions as any)
    filtered = filtered.filter(fabric => 
      careInstructions.some(care => fabric.care_instructions?.toLowerCase().includes(care.toLowerCase()))
    )
  }
  
  // Stock filters
  if (filters.in_stock !== undefined) {
    filtered = filtered.filter(fabric => fabric.in_stock === filters.in_stock)
  }
  
  if (filters.swatch_in_stock !== undefined) {
    filtered = filtered.filter(fabric => fabric.swatch_in_stock === filters.swatch_in_stock)
  }
  
  // Price range filters
  if (filters.min_price !== undefined) {
    filtered = filtered.filter(fabric => (fabric.price || 0) >= (filters.min_price as number))
  }
  
  if (filters.max_price !== undefined) {
    filtered = filtered.filter(fabric => (fabric.price || 0) <= (filters.max_price as number))
  }
  
  if (filters.min_swatch_price !== undefined) {
    filtered = filtered.filter(fabric => (fabric.swatch_price || 0) >= (filters.min_swatch_price as number))
  }
  
  if (filters.max_swatch_price !== undefined) {
    filtered = filtered.filter(fabric => (fabric.swatch_price || 0) <= (filters.max_swatch_price as number))
  }
  
  // Date filters
  if (filters.created_after) {
    const afterDate = new Date(filters.created_after as string)
    filtered = filtered.filter(fabric => new Date(fabric.created_at) > afterDate)
  }
  
  if (filters.created_before) {
    const beforeDate = new Date(filters.created_before as string)
    filtered = filtered.filter(fabric => new Date(fabric.created_at) < beforeDate)
  }
  
  if (filters.updated_after) {
    const afterDate = new Date(filters.updated_after as string)
    filtered = filtered.filter(fabric => fabric.updated_at && new Date(fabric.updated_at) > afterDate)
  }
  
  if (filters.updated_before) {
    const beforeDate = new Date(filters.updated_before as string)
    filtered = filtered.filter(fabric => fabric.updated_at && new Date(fabric.updated_at) < beforeDate)
  }
  
  return filtered
}

function applySorting(fabrics: any[], sortOptions: SortOptions): any[] {
  const { sort_field = 'name', sort_direction = 'asc' } = sortOptions
  
  return fabrics.sort((a, b) => {
    let aVal: any, bVal: any
    
    switch (sort_field) {
      case 'name':
        aVal = (a.name || '').toLowerCase()
        bVal = (b.name || '').toLowerCase()
        break
      case 'price':
        aVal = a.price || 0
        bVal = b.price || 0
        break
      case 'swatch_price':
        aVal = a.swatch_price || 0
        bVal = b.swatch_price || 0
        break
      case 'created_at':
        aVal = new Date(a.created_at || 0).getTime()
        bVal = new Date(b.created_at || 0).getTime()
        break
      case 'updated_at':
        aVal = new Date(a.updated_at || a.created_at || 0).getTime()
        bVal = new Date(b.updated_at || b.created_at || 0).getTime()
        break
      case 'category':
        aVal = (a.category || '').toLowerCase()
        bVal = (b.category || '').toLowerCase()
        break
      case 'collection':
        aVal = (a.collection || '').toLowerCase()
        bVal = (b.collection || '').toLowerCase()
        break
      default:
        aVal = (a.name || '').toLowerCase()
        bVal = (b.name || '').toLowerCase()
    }
    
    let comparison = 0
    if (aVal > bVal) comparison = 1
    else if (aVal < bVal) comparison = -1
    
    return sort_direction === 'desc' ? -comparison : comparison
  })
}

// ==========================================
// METADATA GENERATION
// ==========================================

function generateFilterMetadata(allFabrics: any[]): FilterMetadata {
  const countMap = <T>(items: T[]) => {
    const counts = new Map<T, number>()
    items.forEach(item => {
      if (item !== undefined && item !== null && item !== '') {
        counts.set(item, (counts.get(item) || 0) + 1)
      }
    })
    return Array.from(counts.entries())
      .map(([value, count]) => ({ value: String(value), count }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
  }
  
  const flattenProperties = (fabrics: any[]) => {
    const allProps: string[] = []
    fabrics.forEach(fabric => {
      if (Array.isArray(fabric.properties)) {
        allProps.push(...fabric.properties)
      }
    })
    return allProps
  }
  
  const getNumericRange = (fabrics: any[], field: string) => {
    const values = fabrics
      .map(f => f[field])
      .filter(v => typeof v === 'number' && !isNaN(v))
    
    return values.length > 0 
      ? { min: Math.min(...values), max: Math.max(...values) }
      : { min: 0, max: 0 }
  }
  
  return {
    categories: countMap(allFabrics.map(f => f.category)),
    collections: countMap(allFabrics.map(f => f.collection)),
    colors: countMap(allFabrics.map(f => f.color)),
    color_families: countMap(allFabrics.map(f => f.color_family)),
    patterns: countMap(allFabrics.map(f => f.pattern)),
    usages: countMap(allFabrics.map(f => f.usage)),
    properties: countMap(flattenProperties(allFabrics)),
    compositions: countMap(allFabrics.map(f => f.composition)),
    durabilities: countMap(allFabrics.map(f => f.durability)),
    care_instructions: countMap(allFabrics.map(f => f.care_instructions)),
    price_range: getNumericRange(allFabrics, 'price'),
    swatch_price_range: getNumericRange(allFabrics, 'swatch_price'),
    total_count: allFabrics.length,
    in_stock_count: allFabrics.filter(f => f.in_stock === true).length,
    swatch_available_count: allFabrics.filter(f => f.swatch_in_stock === true).length,
  }
}

// ==========================================
// PRICING UTILITIES
// ==========================================

/**
 * Get fallback fabric pricing based on product characteristics
 */
function getFallbackFabricPrice(productHandle: string): number {
  const handle = productHandle.toLowerCase()

  // Known product pricing based on handle patterns - UPDATED with user's admin prices
  const pricingMap: Record<string, number> = {
    'hf-vv33qkhd2': 530.00,  // Sandwell Lipstick - Updated by user to $530
    'hf-dnh5rt1pt': 85.00,   // Jefferson Linen Sunglow
  }

  // Check for exact match
  if (pricingMap[handle]) {
    return pricingMap[handle]
  }

  // Fallback pricing based on fabric type patterns
  if (handle.includes('linen')) return 85.00
  if (handle.includes('velvet')) return 180.00
  if (handle.includes('silk')) return 225.00
  if (handle.includes('outdoor')) return 75.00
  if (handle.includes('marine')) return 85.00

  // Default premium fabric price
  return 125.00
}

/**
 * Get fallback swatch pricing based on product characteristics
 */
function getFallbackSwatchPrice(productHandle: string): number {
  const handle = productHandle.toLowerCase()

  // Known swatch pricing - UPDATED with user's admin prices
  const pricingMap: Record<string, number> = {
    'hf-vv33qkhd2': 4.50,   // Sandwell Lipstick - Updated by user to $4.50
    'hf-dnh5rt1pt': 3.50,   // Jefferson Linen Sunglow
  }

  // Check for exact match
  if (pricingMap[handle]) {
    return pricingMap[handle]
  }

  // Swatch pricing based on fabric type
  if (handle.includes('silk') || handle.includes('luxury')) return 8.00
  if (handle.includes('velvet')) return 6.50
  if (handle.includes('linen') || handle.includes('cotton')) return 3.50
  if (handle.includes('outdoor') || handle.includes('marine')) return 4.00

  // Default swatch price
  return 5.00
}

// ==========================================
// DATA FETCHING
// ==========================================

async function fetchFromMedusa(searchParams: URLSearchParams) {
  const medusaBackendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://medusa-backend-production-3655.up.railway.app'
  const medusaPublishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

  // For US customers - use USD region when available, fallback to EUR temporarily
  const regionParam = searchParams.get('region') || process.env.NEXT_PUBLIC_MEDUSA_DEFAULT_REGION || 'usd'
  let regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_EUR || 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN'

  // Use USD region if it's configured and not a placeholder
  if (regionParam === 'usd' &&
      process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_USD &&
      !process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_USD.includes('PLACEHOLDER')) {
    regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_USD
    console.log('🇺🇸 Using US region for pricing:', regionId)
  } else {
    console.log('⚠️ USD region not configured yet, using EUR region temporarily')
  }

  // Use custom endpoint that includes metadata
  const medusaUrl = new URL(`${medusaBackendUrl}/store/products-with-metadata`)

  // Apply Medusa-native filters with dynamic region
  medusaUrl.searchParams.set('limit', '100')
  medusaUrl.searchParams.set('offset', '0')
  medusaUrl.searchParams.set('region_id', regionId)

  const search = searchParams.get('search')
  if (search) medusaUrl.searchParams.set('q', search)

  console.log('🔌 Connecting to Medusa backend at:', medusaUrl.toString())

  const medusaResponse = await fetch(medusaUrl.toString(), {
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
  console.log('✅ Successfully fetched from Medusa:', data.products?.length || 0, 'products')

  // Get pricing and inventory data for each product
  const transformedFabrics = await Promise.all(data.products?.map(async (product: any) => {
    // Find fabric and swatch variants
    const fabricVariant = product.variants?.find((v: any) =>
      v.title?.toLowerCase().includes('fabric') || v.title?.toLowerCase().includes('yard')
    )
    const swatchVariant = product.variants?.find((v: any) =>
      v.title?.toLowerCase().includes('swatch')
    )

    // Get pricing for variants - fetch individual product with pricing if needed
    let fabricPrice = 0
    let swatchPrice = 5.00
    let fabricInStock = false
    let swatchInStock = false
    let fabricStockQuantity = 0
    let swatchStockQuantity = 0

    try {
      // Fetch detailed product data including pricing with correct region
      const detailResponse = await fetch(`${medusaBackendUrl}/store/products/${product.id}?region_id=${regionId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-publishable-api-key': medusaPublishableKey
        },
        signal: AbortSignal.timeout(10000)
      })

      if (detailResponse.ok) {
        const detailData = await detailResponse.json()
        const detailProduct = detailData.product

        const detailFabricVariant = detailProduct.variants?.find((v: any) =>
          v.title?.toLowerCase().includes('fabric') || v.title?.toLowerCase().includes('yard')
        )
        const detailSwatchVariant = detailProduct.variants?.find((v: any) =>
          v.title?.toLowerCase().includes('swatch')
        )

        if (detailFabricVariant) {
          // Use calculated price from Medusa - prices come in dollars for USD region
          if (detailFabricVariant.calculated_price?.calculated_amount) {
            fabricPrice = detailFabricVariant.calculated_price.calculated_amount
          } else {
            fabricPrice = 0 // Return 0 if no price set in Medusa
          }

          // Handle inventory - if inventory_quantity is null, assume available with backorder
          fabricStockQuantity = detailFabricVariant.inventory_quantity !== null ? detailFabricVariant.inventory_quantity : 50
          fabricInStock = fabricStockQuantity > 0 || detailFabricVariant.allow_backorder === true
        }

        if (detailSwatchVariant) {
          // Use calculated price from Medusa - prices come in dollars for USD region
          if (detailSwatchVariant.calculated_price?.calculated_amount) {
            swatchPrice = detailSwatchVariant.calculated_price.calculated_amount
          } else {
            swatchPrice = 0 // Return 0 if no price set in Medusa
          }

          // Handle inventory - if inventory_quantity is null, assume available with backorder
          swatchStockQuantity = detailSwatchVariant.inventory_quantity !== null ? detailSwatchVariant.inventory_quantity : 100
          swatchInStock = swatchStockQuantity > 0 || detailSwatchVariant.allow_backorder === true
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch detailed pricing for product ${product.id}:`, error)
      // Fallback to basic variant data - no hardcoded prices
      if (fabricVariant && fabricVariant.calculated_price?.calculated_amount) {
        fabricPrice = fabricVariant.calculated_price.calculated_amount
        fabricStockQuantity = fabricVariant.inventory_quantity !== null ? fabricVariant.inventory_quantity : 50
        fabricInStock = fabricStockQuantity > 0 || fabricVariant.allow_backorder === true
      }
      if (swatchVariant && swatchVariant.calculated_price?.calculated_amount) {
        swatchPrice = swatchVariant.calculated_price.calculated_amount
        swatchStockQuantity = swatchVariant.inventory_quantity !== null ? swatchVariant.inventory_quantity : 100
        swatchInStock = swatchStockQuantity > 0 || swatchVariant.allow_backorder === true
      }
    }

    // Transform to fabric format using actual Medusa data
    return {
      id: product.id,
      name: product.title || 'Untitled Fabric',
      sku: product.handle || product.id,
      description: product.description || '',
      category: product.type?.value || product.categories?.[0]?.name || 'Fabric',
      collection: product.collection?.title || '',
      price: fabricPrice,
      swatch_price: swatchPrice,
      images: product.images?.map((img: any) => {
        // Handle different image URL formats
        if (typeof img.url === 'string') return img.url
        if (typeof img.url === 'object' && img.url.url) return img.url.url
        return img.url
      }).filter(Boolean) || [],
      swatch_image_url: product.thumbnail || product.images?.[0]?.url || '',
      status: product.status || 'active',

      // Use product metadata with fallback values
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

      // Accurate stock information from Medusa
      in_stock: fabricInStock,
      stock_quantity: fabricStockQuantity,
      swatch_in_stock: swatchInStock,
      swatch_stock_quantity: swatchStockQuantity,

      created_at: product.created_at || new Date().toISOString(),
      updated_at: product.updated_at || product.created_at || new Date().toISOString(),

      // Include variant data for frontend use
      variants: product.variants?.map((variant: any) => ({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        price: variant.calculated_price?.calculated_amount || 0,
        inventory_quantity: variant.inventory_quantity || 0,
        allow_backorder: variant.allow_backorder,
        manage_inventory: variant.manage_inventory,
        in_stock: (variant.inventory_quantity || 0) > 0 || variant.allow_backorder === true
      })) || []
    }
  }) || [])

  return transformedFabrics
}


function getMockFabrics() {
  console.log('📝 Using comprehensive mock data')
  
  return [
    {
      id: '1',
      name: 'Palisade Fountain',
      sku: 'PAL-FTN-001',
      category: 'Upholstery',
      collection: 'Palisade',
      price: 125.00,
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
      swatch_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      status: 'active',
      description: 'Premium upholstery fabric from our Palisade collection with exceptional durability',
      color: 'Blue',
      color_family: 'Blue',
      color_hex: '#3b82f6',
      pattern: 'Solid',
      usage: 'Indoor',
      properties: ['Water Resistant', 'Stain Resistant', 'Bleach Cleanable'],
      composition: '100% Solution Dyed Acrylic',
      width: '54 inches',
      weight: 'Medium',
      durability: '50000 double rubs',
      care_instructions: 'Professional cleaning recommended',
      in_stock: true,
      stock_quantity: 45,
      swatch_price: 5.00,
      swatch_in_stock: true,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-03-01T14:30:00Z'
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
      status: 'active',
      description: 'Elegant drapery fabric with subtle texture and natural light filtering',
      color: 'White',
      color_family: 'Neutral',
      color_hex: '#f3f4f6',
      pattern: 'Textured',
      usage: 'Indoor',
      properties: ['Light Filtering', 'Machine Washable', 'Natural Fiber'],
      composition: '60% Cotton, 40% Linen',
      width: '108 inches',
      weight: 'Light',
      durability: '30000 double rubs',
      care_instructions: 'Machine washable cold, tumble dry low',
      in_stock: true,
      stock_quantity: 32,
      swatch_price: 3.50,
      swatch_in_stock: true,
      created_at: '2024-02-01T14:30:00Z',
      updated_at: '2024-02-15T09:20:00Z'
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
      status: 'active',
      description: 'Versatile multipurpose fabric with geometric pattern, perfect for both indoor and outdoor use',
      color: 'Pink',
      color_family: 'Pink',
      color_hex: '#ec4899',
      pattern: 'Geometric',
      usage: 'Both',
      properties: ['UV Resistant', 'Mildew Resistant', 'Fade Resistant', 'Water Repellent'],
      composition: '100% Solution Dyed Acrylic',
      width: '54 inches',
      weight: 'Medium',
      durability: '60000 double rubs',
      care_instructions: 'Spot clean with mild soap and water',
      in_stock: true,
      stock_quantity: 28,
      swatch_price: 4.75,
      swatch_in_stock: true,
      created_at: '2024-01-20T09:15:00Z',
      updated_at: '2024-02-28T16:45:00Z'
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
      status: 'active',
      description: 'Luxurious cotton velvet with rich emerald color and premium feel',
      color: 'Green',
      color_family: 'Green',
      color_hex: '#22c55e',
      pattern: 'Solid',
      usage: 'Indoor',
      properties: ['Luxury', 'Premium', 'Soft Touch', 'Rich Color'],
      composition: '100% Cotton Velvet',
      width: '54 inches',
      weight: 'Heavy',
      durability: '40000 double rubs',
      care_instructions: 'Dry clean only',
      in_stock: true,
      stock_quantity: 12,
      swatch_price: 6.50,
      swatch_in_stock: true,
      created_at: '2024-03-01T16:45:00Z',
      updated_at: '2024-03-05T11:20:00Z'
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
      status: 'active',
      description: 'Weather-resistant outdoor fabric with vibrant striped pattern',
      color: 'Orange',
      color_family: 'Orange',
      color_hex: '#fb923c',
      pattern: 'Striped',
      usage: 'Outdoor',
      properties: ['Weather Resistant', 'UV Protection', 'Quick Dry', 'Fade Resistant'],
      composition: '100% Solution Dyed Acrylic',
      width: '60 inches',
      weight: 'Medium',
      durability: '70000 double rubs',
      care_instructions: 'Machine washable warm, air dry',
      in_stock: false,
      stock_quantity: 0,
      swatch_price: 4.00,
      swatch_in_stock: true,
      created_at: '2024-02-15T11:20:00Z',
      updated_at: '2024-03-10T08:30:00Z'
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
      status: 'active',
      description: 'Classic pure linen in sophisticated charcoal grey',
      color: 'Gray',
      color_family: 'Gray',
      color_hex: '#6b7280',
      pattern: 'Solid',
      usage: 'Indoor',
      properties: ['Natural', 'Breathable', 'Eco Friendly', 'Temperature Regulating'],
      composition: '100% Pure Linen',
      width: '55 inches',
      weight: 'Light',
      durability: '25000 double rubs',
      care_instructions: 'Machine washable warm, tumble dry low',
      in_stock: true,
      stock_quantity: 67,
      swatch_price: 3.00,
      swatch_in_stock: true,
      created_at: '2024-01-10T08:30:00Z',
      updated_at: '2024-02-20T15:45:00Z'
    },
    {
      id: '7',
      name: 'Crimson Royale',
      sku: 'CRM-RYL-001',
      category: 'Silk',
      collection: 'Luxury',
      price: 225.00,
      images: ['https://images.unsplash.com/photo-1571066811602-716837d681de?w=400'],
      swatch_image_url: 'https://images.unsplash.com/photo-1571066811602-716837d681de?w=400',
      status: 'active',
      description: 'Exquisite silk damask with intricate royal pattern in deep crimson',
      color: 'Red',
      color_family: 'Red',
      color_hex: '#dc2626',
      pattern: 'Damask',
      usage: 'Indoor',
      properties: ['Luxury', 'Silk', 'Formal', 'Hand Woven'],
      composition: '100% Mulberry Silk',
      width: '45 inches',
      weight: 'Medium',
      durability: '35000 double rubs',
      care_instructions: 'Dry clean only, professional pressing',
      in_stock: true,
      stock_quantity: 8,
      swatch_price: 8.00,
      swatch_in_stock: false,
      created_at: '2024-03-05T12:00:00Z',
      updated_at: '2024-03-15T14:20:00Z'
    },
    {
      id: '8',
      name: 'Ocean Breeze',
      sku: 'OCN-BRZ-001',
      category: 'Marine',
      collection: 'Coastal',
      price: 85.00,
      images: ['https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=400'],
      swatch_image_url: 'https://images.unsplash.com/photo-1600298881974-6be191ceeda1?w=400',
      status: 'active',
      description: 'Marine-grade fabric designed for coastal environments with salt-water resistance',
      color: 'Teal',
      color_family: 'Blue',
      color_hex: '#14b8a6',
      pattern: 'Woven',
      usage: 'Marine',
      properties: ['Salt Water Resistant', 'Mildew Proof', 'UV Stabilized', 'Quick Dry'],
      composition: '100% PTFE Coated Polyester',
      width: '60 inches',
      weight: 'Heavy',
      durability: '80000 double rubs',
      care_instructions: 'Rinse with fresh water, air dry',
      in_stock: true,
      stock_quantity: 23,
      swatch_price: 5.50,
      swatch_in_stock: true,
      created_at: '2024-02-20T10:15:00Z',
      updated_at: '2024-03-12T13:45:00Z'
    }
  ]
}

// ==========================================
// MAIN API HANDLER
// ==========================================

async function handleGET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    console.log('🎯 Enhanced Fabrics API called with params:', Object.fromEntries(searchParams))
    
    // 1. VALIDATION - Validate all inputs
    const pagination = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      searchParams.get('offset')
    )
    
    const sorting = validateSorting(
      searchParams.get('sort_field'),
      searchParams.get('sort_direction')
    )
    
    const priceRange = validatePriceRange(
      searchParams.get('min_price'),
      searchParams.get('max_price')
    )
    
    const swatchPriceRange = validatePriceRange(
      searchParams.get('swatch_price_min'),
      searchParams.get('swatch_price_max')
    )
    
    // Build comprehensive filter object
    const filters: FabricFilter = {
      search: searchParams.get('search')?.trim() || undefined,
      category: normalizeArrayParam(searchParams.get('category') || ''),
      collection: normalizeArrayParam(searchParams.get('collection') || ''),
      color: normalizeArrayParam(searchParams.get('color') || ''),
      color_family: normalizeArrayParam(searchParams.get('color_family') || ''),
      color_hex: normalizeArrayParam(searchParams.get('color_hex') || ''),
      pattern: normalizeArrayParam(searchParams.get('pattern') || ''),
      usage: normalizeArrayParam(searchParams.get('usage') || ''),
      properties: normalizeArrayParam(searchParams.get('properties') || ''),
      composition: normalizeArrayParam(searchParams.get('composition') || ''),
      durability: normalizeArrayParam(searchParams.get('durability') || ''),
      care_instructions: normalizeArrayParam(searchParams.get('care_instructions') || ''),
      in_stock: parseBooleanParam(searchParams.get('in_stock')),
      swatch_in_stock: parseBooleanParam(searchParams.get('swatch_in_stock')),
      swatch_available: parseBooleanParam(searchParams.get('swatch_available')),
      min_price: priceRange.min,
      max_price: priceRange.max,
      min_swatch_price: swatchPriceRange.min,
      max_swatch_price: swatchPriceRange.max,
      created_after: validateDateRange(searchParams.get('created_after'), 'created_after')?.toISOString(),
      created_before: validateDateRange(searchParams.get('created_before'), 'created_before')?.toISOString(),
      updated_after: validateDateRange(searchParams.get('updated_after'), 'updated_after')?.toISOString(),
      updated_before: validateDateRange(searchParams.get('updated_before'), 'updated_before')?.toISOString(),
    }
    
    // Remove empty filter values
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key]
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        delete (filters as any)[key]
      }
    })
    
    // 2. DATA FETCHING - Prioritize Medusa as the primary source
    let allFabrics: any[] = []
    let dataSource = 'medusa'

    try {
      // Primary source: Medusa backend (production data)
      allFabrics = await fetchFromMedusa(searchParams)
      console.log('✅ Successfully fetched from Medusa:', allFabrics.length, 'products')

      if (allFabrics.length === 0) {
        console.log('ℹ️ No products found in Medusa - returning empty array')
        // Don't throw error - just return empty array which is valid
      }

    } catch (medusaError) {
      console.error('❌ Medusa API error:', medusaError)

      // In production, return empty array instead of throwing error
      if (process.env.NODE_ENV === 'production') {
        console.log('ℹ️ Returning empty array due to Medusa error in production')
        allFabrics = []
        dataSource = 'empty'
      } else {
        // Only use mock data in development
        console.warn('⚠️ Using mock data in development mode')
        allFabrics = getMockFabrics()
        dataSource = 'mock'
      }
    }
    
    // 3. FILTERING - Apply all filters to the complete dataset
    const filteredFabrics = applyFilters(allFabrics, filters)
    
    // 4. SORTING - Apply sorting to filtered results
    const sortedFabrics = applySorting(filteredFabrics, sorting)
    
    // 5. GENERATE METADATA - Generate filter metadata from ALL fabrics (not just filtered)
    const metadata = generateFilterMetadata(allFabrics)
    
    // 6. PAGINATION - Apply pagination to final sorted results
    const totalFilteredCount = sortedFabrics.length
    const startIndex = pagination.offset
    const endIndex = startIndex + pagination.limit
    const paginatedFabrics = sortedFabrics.slice(startIndex, endIndex)
    
    // 7. RESPONSE - Return comprehensive response
    const response = {
      // Main data
      fabrics: paginatedFabrics,
      
      // Pagination metadata
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        offset: pagination.offset,
        count: paginatedFabrics.length,
        totalCount: totalFilteredCount,
        totalPages: Math.ceil(totalFilteredCount / pagination.limit),
        hasNextPage: endIndex < totalFilteredCount,
        hasPreviousPage: pagination.page > 1
      },
      
      // Applied filters (for debugging and frontend state sync)
      appliedFilters: {
        ...filters,
        sort_field: sorting.sort_field,
        sort_direction: sorting.sort_direction
      },
      
      // Filter metadata (for dynamic UI generation)
      filterMetadata: metadata,
      
      // API metadata
      meta: {
        dataSource,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - Date.now(), // Could add actual timing
        apiVersion: '2.0'
      }
    }
    
    console.log('✅ Enhanced API response prepared:', {
      filteredCount: totalFilteredCount,
      returnedCount: paginatedFabrics.length,
      source: dataSource,
      activeFilters: Object.keys(filters).length
    })
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('💥 Error in enhanced fabrics API:', error)
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: error.message,
          type: 'VALIDATION_ERROR'
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Failed to fetch fabrics',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Export wrapped handlers with CORS
export const GET = withCors(handleGET)

// Handle preflight OPTIONS requests
export async function OPTIONS() {
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