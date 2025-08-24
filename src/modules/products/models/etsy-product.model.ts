import { kvClient as kv } from '@/src/core/cache/providers/kv-client'

// Check if KV is available
const isKVAvailable = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
}

export interface EtsyProduct {
  id: string
  title: string
  description?: string
  listingUrl: string
  imageUrl?: string
  price?: string
  featured: boolean
  displayOrder: number
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export class EtsyProductModel {
  private static readonly PREFIX = 'etsy_product:'
  private static readonly INDEX_PREFIX = 'etsy_products_index'

  static async create(product: Omit<EtsyProduct, 'id' | 'createdAt' | 'updatedAt'>): Promise<EtsyProduct> {
    const id = `etsy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const newProduct: EtsyProduct = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now
    }

    await kv.set(`${this.PREFIX}${id}`, newProduct)
    await this.updateIndex(id, 'add')
    
    return newProduct
  }

  static async update(id: string, product: Partial<Omit<EtsyProduct, 'id' | 'createdAt'>>): Promise<EtsyProduct | null> {
    const existing = await this.findById(id)
    if (!existing) return null

    const updatedProduct: EtsyProduct = {
      ...existing,
      ...product,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date()
    }

    await kv.set(`${this.PREFIX}${id}`, updatedProduct)
    
    return updatedProduct
  }

  static async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id)
    if (!existing) return false

    await kv.del(`${this.PREFIX}${id}`)
    await this.updateIndex(id, 'remove')
    
    return true
  }

  static async findById(id: string): Promise<EtsyProduct | null> {
    return await kv.get(`${this.PREFIX}${id}`)
  }

  static async findAll(): Promise<EtsyProduct[]> {
    if (!isKVAvailable()) {
      // Return empty array when KV is not available
      return []
    }
    
    try {
      const ids = await kv.smembers(this.INDEX_PREFIX) || []
      const products = await Promise.all(
        ids.map(id => this.findById(id as string))
      )
      
      return products
        .filter(p => p !== null) as EtsyProduct[]
    } catch (error) {
      console.error('Error fetching Etsy products:', error)
      return []
    }
  }

  static async findFeatured(): Promise<EtsyProduct[]> {
    const allProducts = await this.findAll()
    return allProducts
      .filter(p => p.featured)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }

  private static async updateIndex(id: string, action: 'add' | 'remove') {
    if (action === 'add') {
      await kv.sadd(this.INDEX_PREFIX, id)
    } else {
      await kv.srem(this.INDEX_PREFIX, id)
    }
  }

  static async seed() {
    const sampleProducts: Omit<EtsyProduct, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        title: 'Custom Velvet Cushion Cover - Emerald Green',
        description: 'Luxurious velvet cushion cover, perfect for adding elegance to any room',
        listingUrl: 'https://www.etsy.com/listing/123456789/custom-velvet-cushion-cover',
        imageUrl: '/etsy-velvet-cushion.jpg',
        price: '$45.00',
        featured: true,
        displayOrder: 1,
        tags: ['velvet', 'cushion', 'custom', 'green']
      },
      {
        title: 'Monogrammed Linen Pillow',
        description: 'Personalized linen pillow with custom monogram embroidery',
        listingUrl: 'https://www.etsy.com/listing/987654321/monogrammed-linen-pillow',
        imageUrl: '/etsy-monogram-pillow.jpg',
        price: '$65.00',
        featured: true,
        displayOrder: 2,
        tags: ['linen', 'monogram', 'personalized', 'pillow']
      },
      {
        title: 'Outdoor Cushion Set - Sunbrella Fabric',
        description: 'Weather-resistant outdoor cushions in vibrant patterns',
        listingUrl: 'https://www.etsy.com/listing/456789123/outdoor-cushion-set-sunbrella',
        imageUrl: '/etsy-outdoor-cushion.jpg',
        price: '$120.00',
        featured: true,
        displayOrder: 3,
        tags: ['outdoor', 'sunbrella', 'weather-resistant', 'cushion']
      }
    ]

    for (const product of sampleProducts) {
      await this.create(product)
    }
  }
}