import type { ComponentType } from 'react'

export interface User {
  id: string
  name: string
  email: string
  image: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
}

export interface Post {
  id: string
  title: string
  content: string
  status: 'draft' | 'published' | 'archived'
  scheduledAt?: string
  postedAt?: string
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin'
}

export interface Strategy {
  id: string
  title: string
  content: string
}

export interface NavItem {
  name: string
  href: string
  icon?: ComponentType<{ className?: string }>
}

export interface Fabric {
  id: string
  name: string
  description: string
  category: string
  color: string
  composition: string
  width: string
  weight: string
  durability: string
  careInstructions: string
  inStock: boolean
  swatchImageUrl: string
  detailImages: string[]
  applications: string[]
  features: string[]
  origin: string
  designer?: string
  collection?: string
  patternRepeat?: string
  flammabilityRating: string
  abrasionRating?: string
  lightFastness?: string
  pillResistance?: string
}

export interface SwatchFabric extends Fabric {
  sku: string
  colorFamily: 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Orange' | 'Purple' | 'Pink' | 'Brown' | 'Gray' | 'Black' | 'White' | 'Neutral'
  pattern: 'Solid' | 'Striped' | 'Floral' | 'Geometric' | 'Abstract' | 'Textured' | 'Plaid' | 'Damask'
  usage: 'Indoor' | 'Outdoor' | 'Both'
  properties: string[]
  colorHex: string
}

export interface SwatchCollection {
  id: string
  name: string
  description: string
  image: string
}

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zip: string
  }
}

export interface SwatchOrder {
  id: string
  customerInfo: CustomerInfo
  swatches: string[] // fabric IDs
  project?: string
  marketingOptIn: boolean
  orderDate: string
  trackingNumber?: string
  estimatedDelivery?: string
}
