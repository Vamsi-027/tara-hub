import { kv } from '@vercel/kv'
import type { Fabric } from './types'
import { fabricSeedData } from './fabric-seed-data'
import { memoryStore } from './memory-store'

// Check if KV is available
const isKVAvailable = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
}

// Generate UUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Initialize KV with seed data if empty
export async function initializeFabrics(): Promise<void> {
  if (!isKVAvailable()) {
    console.log('KV not available, initializing memory store with seed data')
    // Initialize memory store with seed data if empty
    const existingFabrics = memoryStore.getAllFabrics()
    if (existingFabrics.length === 0) {
      console.log('Initializing memory store with seed data...')
      for (const fabric of fabricSeedData) {
        memoryStore.setFabric(fabric.id!, fabric)
      }
      console.log(`Initialized ${fabricSeedData.length} fabrics in memory store`)
    }
    return
  }

  try {
    // Check if fabrics already exist
    const existingFabrics = await kv.zrange('fabrics_by_name', 0, 0)
    if (existingFabrics.length > 0) {
      console.log('Fabrics already initialized in KV')
      return
    }

    // Seed initial data
    console.log('Initializing fabrics in KV from seed data...')
    for (const fabric of fabricSeedData) {
      await createFabric(fabric)
    }
    console.log(`Initialized ${fabricSeedData.length} fabrics in KV`)
  } catch (error) {
    console.error('Error initializing fabrics:', error)
  }
}

// CRUD Operations

export async function createFabric(fabricData: Omit<Fabric, 'id'>): Promise<Fabric> {
  const id = fabricData.id || generateUUID()
  const fabric: Fabric = { ...fabricData, id }

  if (!isKVAvailable()) {
    console.log('KV not available, using memory store')
    memoryStore.setFabric(id, fabric)
    return fabric
  }

  try {
    // Store fabric data
    await kv.hset(`fabric:${id}`, fabric)
    
    // Add to sorted set for alphabetical listing
    await kv.zadd('fabrics_by_name', { score: 0, member: id })
    
    // Add to category index
    await kv.sadd(`fabrics_category:${fabric.category}`, id)
    
    // Add to color index
    await kv.sadd(`fabrics_color:${fabric.color}`, id)
    
    // Add to stock status index
    if (fabric.inStock) {
      await kv.sadd('fabrics_in_stock', id)
    } else {
      await kv.sadd('fabrics_out_of_stock', id)
    }
    
    return fabric
  } catch (error) {
    console.error('Error creating fabric in KV:', error)
    throw error
  }
}

export async function getFabric(id: string): Promise<Fabric | null> {
  if (!isKVAvailable()) {
    // Use memory store
    return memoryStore.getFabric(id)
  }

  try {
    const fabric = await kv.hgetall<Fabric>(`fabric:${id}`)
    return fabric
  } catch (error) {
    console.error('Error fetching fabric from KV:', error)
    // Fallback to seed data
    return fabricSeedData.find(f => f.id === id) || null
  }
}

export async function getAllFabrics(filters?: {
  category?: string
  color?: string
  inStock?: boolean
}): Promise<Fabric[]> {
  if (!isKVAvailable()) {
    // Use memory store
    let fabrics = memoryStore.getAllFabrics()
    if (filters?.category) {
      fabrics = fabrics.filter(f => f.category === filters.category)
    }
    if (filters?.color) {
      fabrics = fabrics.filter(f => f.color === filters.color)
    }
    if (filters?.inStock !== undefined) {
      fabrics = fabrics.filter(f => f.inStock === filters.inStock)
    }
    return fabrics
  }

  try {
    let fabricIds: string[]

    // Get filtered fabric IDs based on criteria
    if (filters?.category) {
      fabricIds = await kv.smembers(`fabrics_category:${filters.category}`)
    } else if (filters?.color) {
      fabricIds = await kv.smembers(`fabrics_color:${filters.color}`)
    } else if (filters?.inStock !== undefined) {
      fabricIds = await kv.smembers(filters.inStock ? 'fabrics_in_stock' : 'fabrics_out_of_stock')
    } else {
      // Get all fabric IDs
      fabricIds = await kv.zrange('fabrics_by_name', 0, -1)
    }

    if (fabricIds.length === 0) {
      // If KV is empty, return seed data
      return fabricSeedData
    }

    // Fetch all fabric data
    const pipeline = kv.pipeline()
    fabricIds.forEach(id => pipeline.hgetall(`fabric:${id}`))
    const fabrics = (await pipeline.exec()) as Fabric[]
    
    // Apply additional filters if needed
    let result = fabrics.filter(Boolean)
    if (filters?.category && !filters?.color && !filters?.inStock) {
      // Already filtered by category
    } else {
      if (filters?.color) {
        result = result.filter(f => f.color === filters.color)
      }
      if (filters?.inStock !== undefined) {
        result = result.filter(f => f.inStock === filters.inStock)
      }
    }

    return result
  } catch (error) {
    console.error('Error fetching fabrics from KV:', error)
    // Fallback to seed data
    return fabricSeedData
  }
}

export async function updateFabric(id: string, updates: Partial<Fabric>): Promise<Fabric | null> {
  if (!isKVAvailable()) {
    console.log('KV not available, using memory store')
    const existing = memoryStore.getFabric(id)
    if (!existing) return null
    const updated = { ...existing, ...updates, id }
    memoryStore.setFabric(id, updated)
    return updated
  }

  try {
    const existing = await getFabric(id)
    if (!existing) return null

    const updated: Fabric = { ...existing, ...updates, id }

    // Update main record
    await kv.hset(`fabric:${id}`, updated)

    // Update indices if relevant fields changed
    if (updates.category && updates.category !== existing.category) {
      await kv.srem(`fabrics_category:${existing.category}`, id)
      await kv.sadd(`fabrics_category:${updated.category}`, id)
    }

    if (updates.color && updates.color !== existing.color) {
      await kv.srem(`fabrics_color:${existing.color}`, id)
      await kv.sadd(`fabrics_color:${updated.color}`, id)
    }

    if (updates.inStock !== undefined && updates.inStock !== existing.inStock) {
      if (updated.inStock) {
        await kv.srem('fabrics_out_of_stock', id)
        await kv.sadd('fabrics_in_stock', id)
      } else {
        await kv.srem('fabrics_in_stock', id)
        await kv.sadd('fabrics_out_of_stock', id)
      }
    }

    return updated
  } catch (error) {
    console.error('Error updating fabric in KV:', error)
    return null
  }
}

export async function deleteFabric(id: string): Promise<boolean> {
  if (!isKVAvailable()) {
    console.log('KV not available, using memory store')
    return memoryStore.deleteFabric(id)
  }

  try {
    const fabric = await getFabric(id)
    if (!fabric) return false

    // Remove from all indices
    await kv.del(`fabric:${id}`)
    await kv.zrem('fabrics_by_name', id)
    await kv.srem(`fabrics_category:${fabric.category}`, id)
    await kv.srem(`fabrics_color:${fabric.color}`, id)
    await kv.srem(fabric.inStock ? 'fabrics_in_stock' : 'fabrics_out_of_stock', id)

    return true
  } catch (error) {
    console.error('Error deleting fabric from KV:', error)
    return false
  }
}

// Get unique categories and colors for filters
export async function getFabricFilters(): Promise<{
  categories: string[]
  colors: string[]
}> {
  if (!isKVAvailable()) {
    // Extract from seed data
    const categories = [...new Set(fabricSeedData.map(f => f.category))]
    const colors = [...new Set(fabricSeedData.map(f => f.color))]
    return { categories, colors }
  }

  try {
    // Get all fabric IDs
    const fabricIds = await kv.zrange('fabrics_by_name', 0, -1)
    
    if (fabricIds.length === 0) {
      // Fallback to seed data
      const categories = [...new Set(fabricSeedData.map(f => f.category))]
      const colors = [...new Set(fabricSeedData.map(f => f.color))]
      return { categories, colors }
    }

    // Fetch all fabrics to extract unique values
    const pipeline = kv.pipeline()
    fabricIds.forEach(id => pipeline.hgetall(`fabric:${id}`))
    const fabrics = (await pipeline.exec()) as Fabric[]
    
    const categories = [...new Set(fabrics.filter(Boolean).map(f => f.category))]
    const colors = [...new Set(fabrics.filter(Boolean).map(f => f.color))]
    
    return { categories, colors }
  } catch (error) {
    console.error('Error fetching fabric filters from KV:', error)
    // Fallback to seed data
    const categories = [...new Set(fabricSeedData.map(f => f.category))]
    const colors = [...new Set(fabricSeedData.map(f => f.color))]
    return { categories, colors }
  }
}