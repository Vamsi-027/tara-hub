import { Fabric } from './fabric-api'

// Medusa Product type definition
export interface MedusaProduct {
  id: string
  title: string
  subtitle?: string | null
  description?: string | null
  handle?: string
  is_giftcard: boolean
  status: string
  images?: MedusaImage[]
  thumbnail?: string | null
  options?: MedusaProductOption[]
  variants?: MedusaProductVariant[]
  categories?: MedusaProductCategory[]
  profile_id: string
  weight?: number | null
  length?: number | null
  height?: number | null
  width?: number | null
  hs_code?: string | null
  origin_country?: string | null
  mid_code?: string | null
  material?: string | null
  collection?: MedusaCollection | null
  collection_id?: string | null
  type?: MedusaProductType | null
  type_id?: string | null
  tags?: MedusaProductTag[]
  discountable: boolean
  external_id?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  metadata?: Record<string, any> | null
}

export interface MedusaImage {
  id: string
  url: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  metadata?: Record<string, any> | null
  rank?: number
}

export interface MedusaProductOption {
  id: string
  title: string
  values: MedusaProductOptionValue[]
  product_id: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  metadata?: Record<string, any> | null
}

export interface MedusaProductOptionValue {
  id: string
  value: string
  option_id: string
  variant_id: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  metadata?: Record<string, any> | null
}

export interface MedusaProductVariant {
  id: string
  title: string
  product_id: string
  sku?: string | null
  barcode?: string | null
  ean?: string | null
  upc?: string | null
  variant_rank?: number | null
  inventory_quantity: number
  allow_backorder: boolean
  manage_inventory: boolean
  hs_code?: string | null
  origin_country?: string | null
  mid_code?: string | null
  material?: string | null
  weight?: number | null
  length?: number | null
  height?: number | null
  width?: number | null
  options?: MedusaProductOptionValue[]
  prices?: MedusaPrice[]
  created_at: string
  updated_at: string
  deleted_at?: string | null
  metadata?: Record<string, any> | null
}

export interface MedusaPrice {
  id: string
  currency_code: string
  amount: number
  min_quantity?: number | null
  max_quantity?: number | null
  variant_id: string
  region_id?: string | null
  price_list_id?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface MedusaProductCategory {
  id: string
  name: string
  handle: string
  parent_category_id?: string | null
  parent_category?: MedusaProductCategory | null
  category_children?: MedusaProductCategory[]
  is_active: boolean
  is_internal: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
  metadata?: Record<string, any> | null
}

export interface MedusaCollection {
  id: string
  title: string
  handle: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  metadata?: Record<string, any> | null
}

export interface MedusaProductType {
  id: string
  value: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  metadata?: Record<string, any> | null
}

export interface MedusaProductTag {
  id: string
  value: string
  created_at: string
  updated_at: string
  deleted_at?: string | null
  metadata?: Record<string, any> | null
}

// Transform Medusa product to Fabric format
export function transformMedusaToFabric(product: MedusaProduct): any {
  // Get the first variant for pricing (or default variant)
  const defaultVariant = product.variants?.[0]
  const price = defaultVariant?.prices?.[0]?.amount || 0

  // Extract metadata fields if they exist
  const metadata = product.metadata || {}

  return {
    id: product.id,
    name: product.title,
    sku: defaultVariant?.sku || product.handle || product.id,
    category: product.categories?.[0]?.name || product.type?.value || 'Uncategorized',
    material: product.material || metadata.material || metadata.composition || '',
    composition: metadata.composition || product.material || '',
    weight: metadata.weight || (product.weight ? `${product.weight}g` : ''),
    width: metadata.width || (product.width ? `${product.width}cm` : ''),
    price: price / 100, // Convert from cents to dollars
    currency: 'USD',
    unit: metadata.unit || 'yard',
    min_order: metadata.min_order || 1,
    in_stock: defaultVariant?.inventory_quantity ? defaultVariant.inventory_quantity > 0 : true,
    lead_time: metadata.lead_time || '2-3 business days',
    
    // Images
    images: product.images?.map(img => img.url) || [],
    thumbnail_url: product.thumbnail || product.images?.[0]?.url || '',
    swatch_image_url: metadata.swatch_image_url || product.thumbnail || product.images?.[0]?.url || '',
    
    // Colors
    color: metadata.color || '',
    color_family: metadata.color_family || '',
    color_hex: metadata.color_hex || '#94a3b8',
    
    // Pattern and style
    pattern: metadata.pattern || '',
    style: metadata.style || '',
    texture: metadata.texture || '',
    
    // Usage and care
    usage: metadata.usage || '',
    care_instructions: metadata.care_instructions || '',
    
    // Features
    features: metadata.features || [],
    tags: product.tags?.map(tag => tag.value) || [],
    
    // Brand and origin
    brand: metadata.brand || '',
    origin: product.origin_country || metadata.origin || '',
    
    // Additional properties
    description: product.description || '',
    created_at: product.created_at,
    updated_at: product.updated_at,
    
    // Ratings (placeholder - would come from reviews)
    rating: metadata.rating || 0,
    reviews_count: metadata.reviews_count || 0,
    
    // Stock management
    stock_quantity: defaultVariant?.inventory_quantity || 0,
    stock_unit: metadata.stock_unit || 'yard',
    
    // Swatch availability
    swatch_price: metadata.swatch_price || 5,
    swatch_in_stock: metadata.swatch_in_stock !== false,
    
    // Certifications
    certifications: metadata.certifications || [],
    
    // Featured flags
    is_featured: metadata.is_featured || false,
    is_new: metadata.is_new || false,
    is_eco: metadata.is_eco || false,
    
    // Sustainability
    sustainability_score: metadata.sustainability_score || 0,
    recycled_content: metadata.recycled_content || 0
  }
}

// Fetch products from Medusa backend
export async function fetchMedusaProducts(options?: {
  limit?: number
  offset?: number
  category?: string
  search?: string
}): Promise<{ products: MedusaProduct[], count: number }> {
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
  const params = new URLSearchParams()
  
  if (options?.limit) params.append('limit', options.limit.toString())
  if (options?.offset) params.append('offset', options.offset.toString())
  if (options?.category) params.append('category_id', options.category)
  if (options?.search) params.append('q', options.search)
  
  try {
    const response = await fetch(`${baseUrl}/store/products?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`)
    }
    
    const data = await response.json()
    return {
      products: data.products || [],
      count: data.count || 0
    }
  } catch (error) {
    console.error('Error fetching Medusa products:', error)
    return {
      products: [],
      count: 0
    }
  }
}

// Alias for products page
export async function getProducts(options?: {
  q?: string
  collection?: string
  category?: string
  page?: string
  limit?: string
}) {
  const limit = parseInt(options?.limit || '12')
  const page = parseInt(options?.page || '1')
  const offset = (page - 1) * limit
  
  return fetchMedusaProducts({
    limit,
    offset,
    category: options?.category,
    search: options?.q
  })
}

// Get collections from Medusa
export async function getCollections() {
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
  
  try {
    const response = await fetch(`${baseUrl}/store/collections`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.collections || []
  } catch (error) {
    console.error('Error fetching collections:', error)
    return []
  }
}

// Get categories from Medusa
export async function getCategories() {
  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
  
  try {
    const response = await fetch(`${baseUrl}/store/product-categories`, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.product_categories || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}