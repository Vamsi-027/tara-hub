// Fabric type definition
export interface Fabric {
  id: string
  name: string
  description?: string
  category?: string
  colorFamily?: string | string[]
  primaryColor?: string
  secondaryColors?: string[]
  pattern?: string
  material?: string
  price?: number | string
  inStock?: boolean
  image?: string
  images?: Array<{ url: string; alt?: string }>
  durabilityRating?: string | number
  stockQuantity?: number
  fiberContent?: Array<{ fiber: string; percentage: number }>
  careInstructions?: string | string[]
  certifications?: Array<{ name: string; description?: string }>
  additionalFeatures?: {
    customizationOptions?: string[]
    acousticProperties?: {
      description?: string
      nrc?: number
      absorptionRate?: number
    }
    sustainabilityNotes?: string
    [key: string]: any
  }
  [key: string]: any // Allow additional properties
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' 
    ? window.location.origin.replace(':3007', ':3000')  // In dev, admin runs on 3000
    : 'http://localhost:3000')

export interface FabricFilters {
  category?: string
  color?: string
  search?: string
  type?: string
  manufacturer?: string
  collection?: string
  durabilityRating?: string | number
  petFriendly?: boolean
  stainResistant?: boolean
  outdoorSafe?: boolean
  waterResistant?: boolean
  fadeResistant?: boolean
  page?: number
  limit?: number
}

export interface FabricsResponse {
  fabrics: Fabric[]
  total: number
  page: number
  limit: number
  totalPages: number
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  async fetchFabrics(filters: FabricFilters = {}): Promise<FabricsResponse> {
    try {
      const queryString = this.buildQueryString(filters)
      const response = await fetch(`${this.baseUrl}/api/fabrics${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh data
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch fabrics: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Handle both array response and paginated response
      if (Array.isArray(data)) {
        return {
          fabrics: data,
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1
        }
      }
      
      return data
    } catch (error) {
      console.error('Error fetching fabrics:', error)
      throw error
    }
  }

  async fetchFabricById(id: string): Promise<Fabric | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/fabrics/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch fabric: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching fabric:', error)
      throw error
    }
  }

  async fetchFabricCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/fabrics/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (!response.ok) {
        // Fallback to default categories if endpoint doesn't exist
        return ['Upholstery', 'Drapery', 'Multi-Purpose', 'Outdoor', 'Sheer', 'Blackout']
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching categories:', error)
      // Return default categories as fallback
      return ['Upholstery', 'Drapery', 'Multi-Purpose', 'Outdoor', 'Sheer', 'Blackout']
    }
  }

  async fetchFabricColors(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/fabrics/colors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (!response.ok) {
        // Fallback to default colors if endpoint doesn't exist
        return ['Blue', 'Green', 'Red', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Gray', 'Black', 'White', 'Beige']
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching colors:', error)
      // Return default colors as fallback
      return ['Blue', 'Green', 'Red', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Gray', 'Black', 'White', 'Beige']
    }
  }

  async fetchManufacturers(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/fabrics/manufacturers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (!response.ok) {
        return []
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching manufacturers:', error)
      return []
    }
  }

  async fetchCollections(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/fabrics/collections`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (!response.ok) {
        return []
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching collections:', error)
      return []
    }
  }
}

export const apiClient = new ApiClient()