// Fabric API Client - Updated to use main app API or local API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006'
const MAIN_APP_URL = 'http://localhost:3000'

export interface FabricCollection {
  id: string
  name: string
  description: string
  image: string
}

export interface FabricVariant {
  id: string
  title: string
  sku: string
  type: 'Swatch' | 'Fabric'
  price: number
  inventory_quantity: number
  in_stock: boolean
}

export interface Fabric {
  id: string
  name: string
  sku: string
  description: string
  category: string
  color: string
  color_family: string
  pattern: string
  usage: 'Indoor' | 'Outdoor' | 'Both'
  properties: string[]
  swatch_image_url: string
  color_hex: string
  composition: string
  width: string
  weight: string
  durability: string
  care_instructions: string
  in_stock: boolean
  collection?: string
  price?: number
  stock_quantity?: number
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
  // New variant fields
  swatch_price?: number
  swatch_in_stock?: boolean
  swatch_size?: string
  minimum_order_yards?: string
  variants?: FabricVariant[]
}

export interface FabricListResponse {
  fabrics: Fabric[]
  count: number
  totalCount?: number
  page?: number
  totalPages?: number
  offset: number
  limit: number
}

export interface FabricFilters {
  category?: string
  collection?: string
  color_family?: string
  pattern?: string
  usage?: string
  in_stock?: boolean
  limit?: number
  offset?: number
  page?: number
  search?: string
  sort_field?: 'name' | 'price' | 'created_at' | 'category'
  sort_direction?: 'asc' | 'desc'
  min_price?: number
  max_price?: number
}

class FabricAPI {
  private baseUrl: string

  constructor() {
    // Use relative URL for same-origin requests (avoids CORS issues)
    // This will use the fabric-store's own API endpoints
    this.baseUrl = '/api'
  }

  private async fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      throw error
    }
  }

  // Get all fabrics with optional filters
  async listFabrics(filters?: FabricFilters): Promise<FabricListResponse> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/fabrics?${queryString}` : '/fabrics'
    
    return this.fetchAPI<FabricListResponse>(endpoint)
  }

  // Get a single fabric by ID
  async getFabric(id: string): Promise<{ fabric: Fabric }> {
    return this.fetchAPI<{ fabric: Fabric }>(`/fabrics/${id}`)
  }

  // Get a fabric by SKU
  async getFabricBySku(sku: string): Promise<{ fabric: Fabric }> {
    return this.fetchAPI<{ fabric: Fabric }>(`/fabrics/sku/${sku}`)
  }

  // Search fabrics
  async searchFabrics(query: string): Promise<{ fabrics: Fabric[] }> {
    return this.fetchAPI<{ fabrics: Fabric[] }>(`/fabrics/search/${encodeURIComponent(query)}`)
  }

  // Get all collections
  async getCollections(): Promise<{ collections: FabricCollection[] }> {
    return this.fetchAPI<{ collections: FabricCollection[] }>('/fabric-collections')
  }

  // Get all categories
  async getCategories(): Promise<{ categories: string[] }> {
    return this.fetchAPI<{ categories: string[] }>('/fabric-categories')
  }

  // Create a new fabric (admin only)
  async createFabric(fabric: Omit<Fabric, 'id' | 'created_at' | 'updated_at'>): Promise<{ fabric: Fabric }> {
    return this.fetchAPI<{ fabric: Fabric }>('/fabrics', {
      method: 'POST',
      body: JSON.stringify(fabric),
    })
  }

  // Update a fabric (admin only)
  async updateFabric(id: string, updates: Partial<Fabric>): Promise<{ fabric: Fabric }> {
    return this.fetchAPI<{ fabric: Fabric }>(`/fabrics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // Update stock quantity
  async updateStock(sku: string, quantity: number): Promise<{ fabric: Fabric }> {
    return this.fetchAPI<{ fabric: Fabric }>(`/fabrics/sku/${sku}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    })
  }

  // Delete a fabric (admin only)
  async deleteFabric(id: string): Promise<void> {
    await this.fetchAPI<void>(`/fabrics/${id}`, {
      method: 'DELETE',
    })
  }

  // Bulk create fabrics (admin only)
  async bulkCreateFabrics(fabrics: Array<Omit<Fabric, 'id' | 'created_at' | 'updated_at'>>): Promise<{ fabrics: Fabric[], count: number }> {
    return this.fetchAPI<{ fabrics: Fabric[], count: number }>('/fabrics/bulk', {
      method: 'POST',
      body: JSON.stringify({ fabrics }),
    })
  }
}

// Export a singleton instance
export const fabricAPI = new FabricAPI()

// Helper function to transform old fabric data format to new format
export function transformLegacyFabric(oldFabric: any): Fabric {
  return {
    id: oldFabric.id,
    name: oldFabric.name,
    sku: oldFabric.sku,
    description: oldFabric.description || '',
    category: oldFabric.category,
    color: oldFabric.color,
    color_family: oldFabric.colorFamily || oldFabric.color_family,
    pattern: oldFabric.pattern,
    usage: oldFabric.usage,
    properties: oldFabric.properties,
    swatch_image_url: oldFabric.swatchImageUrl || oldFabric.swatch_image_url,
    color_hex: oldFabric.colorHex || oldFabric.color_hex,
    composition: oldFabric.composition,
    width: oldFabric.width,
    weight: oldFabric.weight,
    durability: oldFabric.durability,
    care_instructions: oldFabric.careInstructions || oldFabric.care_instructions,
    in_stock: oldFabric.inStock !== undefined ? oldFabric.inStock : oldFabric.in_stock,
    collection: oldFabric.collection,
    price: oldFabric.price,
    stock_quantity: oldFabric.stock_quantity || 0,
    metadata: oldFabric.metadata,
  }
}