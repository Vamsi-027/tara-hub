// In-memory store for development/fallback when KV is not available
// This provides persistence during the application lifecycle

interface MemoryStore {
  posts: Map<string, any>
  blogPosts: Map<string, any>
  fabrics: Map<string, any>
  products: Map<string, any>
  strategies: Map<string, any>
}

class InMemoryStore {
  private static instance: InMemoryStore
  private store: MemoryStore

  private constructor() {
    this.store = {
      posts: new Map(),
      blogPosts: new Map(),
      fabrics: new Map(),
      products: new Map(),
      strategies: new Map()
    }
    console.log('📦 In-memory store initialized (data will persist during app lifecycle)')
  }

  static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore()
    }
    return InMemoryStore.instance
  }

  // Posts
  setPost(id: string, data: any) {
    this.store.posts.set(id, data)
    return data
  }

  getPost(id: string) {
    return this.store.posts.get(id) || null
  }

  getAllPosts() {
    return Array.from(this.store.posts.values())
  }

  deletePost(id: string) {
    return this.store.posts.delete(id)
  }

  // Blog Posts
  setBlogPost(id: string, data: any) {
    this.store.blogPosts.set(id, data)
    // Also maintain slug mapping
    if (data.slug) {
      this.store.blogPosts.set(`slug:${data.slug}`, id)
    }
    return data
  }

  getBlogPost(id: string) {
    return this.store.blogPosts.get(id) || null
  }

  getBlogPostBySlug(slug: string) {
    const id = this.store.blogPosts.get(`slug:${slug}`)
    return id ? this.getBlogPost(id) : null
  }

  getAllBlogPosts() {
    return Array.from(this.store.blogPosts.values()).filter(item => 
      typeof item === 'object' && item.id // Filter out slug mappings
    )
  }

  updateBlogPost(id: string, updates: any) {
    const existing = this.getBlogPost(id)
    if (!existing) return null
    
    // Handle slug changes
    if (updates.slug && updates.slug !== existing.slug) {
      // Remove old slug mapping
      this.store.blogPosts.delete(`slug:${existing.slug}`)
      // Add new slug mapping
      this.store.blogPosts.set(`slug:${updates.slug}`, id)
    }
    
    const updated = { ...existing, ...updates }
    this.setBlogPost(id, updated)
    return updated
  }

  deleteBlogPost(id: string) {
    const post = this.getBlogPost(id)
    if (post && post.slug) {
      this.store.blogPosts.delete(`slug:${post.slug}`)
    }
    return this.store.blogPosts.delete(id)
  }

  // Products
  setProduct(id: string, data: any) {
    this.store.products.set(id, data)
    return data
  }

  getProduct(id: string) {
    return this.store.products.get(id) || null
  }

  getAllProducts() {
    return Array.from(this.store.products.values())
  }

  deleteProduct(id: string) {
    return this.store.products.delete(id)
  }

  // Strategies
  setStrategy(id: string, data: any) {
    this.store.strategies.set(id, data)
    return data
  }

  getStrategy(id: string) {
    return this.store.strategies.get(id) || null
  }

  getAllStrategies() {
    return Array.from(this.store.strategies.values())
  }

  deleteStrategy(id: string) {
    return this.store.strategies.delete(id)
  }

  // Fabrics
  setFabric(id: string, data: any) {
    this.store.fabrics.set(id, data)
    return data
  }

  getFabric(id: string) {
    return this.store.fabrics.get(id) || null
  }

  getAllFabrics() {
    return Array.from(this.store.fabrics.values())
  }

  deleteFabric(id: string) {
    return this.store.fabrics.delete(id)
  }

  // Utility methods
  clearAll() {
    this.store.posts.clear()
    this.store.blogPosts.clear()
    this.store.fabrics.clear()
    this.store.products.clear()
    this.store.strategies.clear()
    console.log('🗑️ In-memory store cleared')
  }

  getStats() {
    return {
      posts: this.store.posts.size,
      blogPosts: this.store.blogPosts.size,
      fabrics: this.store.fabrics.size,
      products: this.store.products.size,
      strategies: this.store.strategies.size
    }
  }
}

export const memoryStore = InMemoryStore.getInstance()