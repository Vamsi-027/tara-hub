// Post types
export interface DBPost {
  id: string
  title: string
  content: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin'
  scheduledDate: string
  status: 'draft' | 'scheduled' | 'published'
  imageUrl?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

// Product types
export interface DBProduct {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Strategy types
export interface DBStrategy {
  id: string
  title: string
  description: string
  objectives: string[]
  targetAudience: string
  platforms: string[]
  timeline: string
  budget?: number
  kpis: string[]
  createdAt: string
  updatedAt: string
}

// Fabric types
export interface DBFabric {
  // Core Identification
  id: string
  name: string
  sku?: string
  description?: string
  
  // Fabric Classification
  type: "Upholstery" | "Drapery" | "Both"
  pattern: string
  color: string
  colorHex?: string
  manufacturer: string
  collection?: string
  
  // Pricing & Ordering
  pricePerYard: number
  width: number
  minimumOrder: number
  leadTime: number
  stockQuantity: number
  isCustomOrder: boolean
  
  // Physical Properties
  content?: string
  weight?: number
  durability: number
  martindale?: number
  
  // Treatment Features
  isStainResistant: boolean
  isFadeResistant: boolean
  isWaterResistant: boolean
  isPetFriendly: boolean
  isOutdoorSafe: boolean
  isFireRetardant: boolean
  
  // Care & Instructions
  careInstructions?: string[]
  notes?: string
  
  // Visual Assets
  images?: {
    thumbnail?: string
    main?: string
    detail?: string[]
    room?: string[]
  }
  swatchImageUrl?: string
  
  // Categorization & Display
  tags?: string[]
  isActive: boolean
  isFeatured: boolean
  warranty_info?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}
