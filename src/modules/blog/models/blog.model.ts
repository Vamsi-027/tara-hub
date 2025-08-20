import { kvClient, isKVAvailable } from './kv-client'
import { memoryStore } from './memory-store'

// Use kvClient instead of direct kv import
const kv = kvClient

export interface BlogPostModel {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  featuredImage?: string
  author: {
    name: string
    email?: string
    avatar?: string
    role?: string
  }
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  scheduledAt?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  readTime?: number
  views?: number
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

// Generate unique slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

// Calculate read time based on content
export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

// Check if KV is available
// isKVAvailable is now imported from kv-client

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

// Blog Post CRUD Operations
export async function createBlogPost(postData: Omit<BlogPostModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPostModel> {
  const id = generateUUID()
  const now = new Date().toISOString()
  
  const post: BlogPostModel = {
    ...postData,
    id,
    slug: postData.slug || generateSlug(postData.title),
    readTime: calculateReadTime(postData.content),
    views: 0,
    createdAt: now,
    updatedAt: now
  }

  if (!isKVAvailable()) {
    console.log('KV not available, using in-memory store for blog post')
    return memoryStore.setBlogPost(id, post)
  }

  try {
    await kv.hset(`blog:${id}`, post)
    await kv.hset(`blog_slug:${post.slug}`, { id }) // Map slug to ID for slug-based lookups
    
    // Add to sorted sets for different views
    const score = new Date(post.publishedAt || now).getTime()
    await kv.zadd('blogs_by_date', { score, member: id })
    
    if (post.status === 'published') {
      await kv.zadd('blogs_published', { score, member: id })
    } else if (post.status === 'draft') {
      await kv.zadd('blogs_drafts', { score, member: id })
    }
    
    // Add to category index
    await kv.sadd(`blogs_category:${post.category}`, id)
    
    // Add to tag indices
    for (const tag of post.tags) {
      await kv.sadd(`blogs_tag:${tag}`, id)
    }
    
    return post
  } catch (error) {
    console.error('Error creating blog post in KV:', error)
    throw error
  }
}

export async function getBlogPost(id: string): Promise<BlogPostModel | null> {
  if (!isKVAvailable()) {
    return memoryStore.getBlogPost(id)
  }
  
  try {
    const post = await kv.hgetall<BlogPostModel>(`blog:${id}`)
    return post
  } catch (error) {
    console.error('Error fetching blog post from KV:', error)
    return null
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostModel | null> {
  if (!isKVAvailable()) {
    return memoryStore.getBlogPostBySlug(slug)
  }
  
  try {
    const slugData = await kv.hgetall<{ id: string }>(`blog_slug:${slug}`)
    if (!slugData?.id) return null
    
    return getBlogPost(slugData.id)
  } catch (error) {
    console.error('Error fetching blog post by slug from KV:', error)
    return null
  }
}

export async function getAllBlogPosts(options?: {
  status?: 'draft' | 'published' | 'archived'
  category?: string
  tag?: string
  limit?: number
  offset?: number
}): Promise<BlogPostModel[]> {
  if (!isKVAvailable()) {
    let posts = memoryStore.getAllBlogPosts()
    
    // Apply filters
    if (options?.status) {
      posts = posts.filter(p => p.status === options.status)
    }
    if (options?.category) {
      posts = posts.filter(p => p.category === options.category)
    }
    if (options?.tag) {
      posts = posts.filter(p => p.tags.includes(options.tag))
    }
    
    // Apply pagination
    if (options?.offset !== undefined) {
      posts = posts.slice(options.offset)
    }
    if (options?.limit !== undefined) {
      posts = posts.slice(0, options.limit)
    }
    
    return posts
  }
  
  try {
    let key = 'blogs_by_date'
    if (options?.status === 'published') {
      key = 'blogs_published'
    } else if (options?.status === 'draft') {
      key = 'blogs_drafts'
    }
    
    const start = options?.offset || 0
    const stop = options?.limit ? start + options.limit - 1 : -1
    
    let postIds: string[]
    
    if (options?.category) {
      postIds = await kv.smembers(`blogs_category:${options.category}`)
    } else if (options?.tag) {
      postIds = await kv.smembers(`blogs_tag:${options.tag}`)
    } else {
      postIds = await kv.zrange(key, start, stop, { rev: true })
    }
    
    // If KV operation failed, fall back to memory store
    if (!postIds || postIds.length === 0) {
      const memPosts = memoryStore.getAllBlogPosts()
      if (memPosts.length > 0) {
        console.log('Using in-memory store for blog posts (KV unavailable)')
        return memPosts
      }
      return []
    }
    
    const pipeline = kv.pipeline()
    postIds.forEach(id => pipeline.hgetall(`blog:${id}`))
    const results = (await pipeline.exec()) as BlogPostModel[]
    
    // Filter by status if needed
    let filtered = results.filter(Boolean)
    if (options?.status) {
      filtered = filtered.filter(post => post.status === options.status)
    }
    
    return filtered
  } catch (error) {
    console.error('Error fetching blog posts from KV, using fallback:', error)
    // Fall back to memory store on any error
    return memoryStore.getAllBlogPosts()
  }
}

export async function updateBlogPost(id: string, updates: Partial<BlogPostModel>): Promise<BlogPostModel | null> {
  if (!isKVAvailable()) {
    const existing = memoryStore.getBlogPost(id)
    if (!existing) return null
    
    const updated: BlogPostModel = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString()
    }
    
    if (updates.title && !updates.slug) {
      updated.slug = generateSlug(updates.title)
    }
    if (updates.content) {
      updated.readTime = calculateReadTime(updates.content)
    }
    
    return memoryStore.updateBlogPost(id, updated)
  }
  
  try {
    const existingPost = await getBlogPost(id)
    if (!existingPost) return null
    
    const updatedPost: BlogPostModel = {
      ...existingPost,
      ...updates,
      id: existingPost.id, // Ensure ID doesn't change
      createdAt: existingPost.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    }
    
    // Update slug if title changed
    if (updates.title && !updates.slug) {
      updatedPost.slug = generateSlug(updates.title)
    }
    
    // Recalculate read time if content changed
    if (updates.content) {
      updatedPost.readTime = calculateReadTime(updates.content)
    }
    
    // Update main post data
    await kv.hset(`blog:${id}`, updatedPost)
    
    // Update slug mapping if slug changed
    if (updatedPost.slug !== existingPost.slug) {
      await kv.del(`blog_slug:${existingPost.slug}`)
      await kv.hset(`blog_slug:${updatedPost.slug}`, { id })
    }
    
    // Update status indices if status changed
    if (updatedPost.status !== existingPost.status) {
      const score = new Date(updatedPost.publishedAt || updatedPost.createdAt).getTime()
      
      // Remove from old status index
      if (existingPost.status === 'published') {
        await kv.zrem('blogs_published', id)
      } else if (existingPost.status === 'draft') {
        await kv.zrem('blogs_drafts', id)
      }
      
      // Add to new status index
      if (updatedPost.status === 'published') {
        await kv.zadd('blogs_published', { score, member: id })
      } else if (updatedPost.status === 'draft') {
        await kv.zadd('blogs_drafts', { score, member: id })
      }
    }
    
    // Update category index if category changed
    if (updatedPost.category !== existingPost.category) {
      await kv.srem(`blogs_category:${existingPost.category}`, id)
      await kv.sadd(`blogs_category:${updatedPost.category}`, id)
    }
    
    // Update tag indices if tags changed
    if (JSON.stringify(updatedPost.tags) !== JSON.stringify(existingPost.tags)) {
      // Remove from old tags
      for (const tag of existingPost.tags) {
        await kv.srem(`blogs_tag:${tag}`, id)
      }
      // Add to new tags
      for (const tag of updatedPost.tags) {
        await kv.sadd(`blogs_tag:${tag}`, id)
      }
    }
    
    return updatedPost
  } catch (error) {
    console.error('Error updating blog post in KV:', error)
    throw error
  }
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  if (!isKVAvailable()) {
    return memoryStore.deleteBlogPost(id)
  }
  
  try {
    const post = await getBlogPost(id)
    if (!post) return false
    
    // Delete main post data
    await kv.del(`blog:${id}`)
    
    // Delete slug mapping
    await kv.del(`blog_slug:${post.slug}`)
    
    // Remove from all indices
    await kv.zrem('blogs_by_date', id)
    await kv.zrem('blogs_published', id)
    await kv.zrem('blogs_drafts', id)
    await kv.srem(`blogs_category:${post.category}`, id)
    
    for (const tag of post.tags) {
      await kv.srem(`blogs_tag:${tag}`, id)
    }
    
    return true
  } catch (error) {
    console.error('Error deleting blog post from KV:', error)
    return false
  }
}

// Get blog statistics
export async function getBlogStats(): Promise<{
  total: number
  published: number
  drafts: number
  categories: string[]
  tags: string[]
}> {
  if (!isKVAvailable()) {
    return {
      total: 0,
      published: 0,
      drafts: 0,
      categories: [],
      tags: []
    }
  }
  
  try {
    const [total, published, drafts] = await Promise.all([
      kv.zcard('blogs_by_date'),
      kv.zcard('blogs_published'),
      kv.zcard('blogs_drafts')
    ])
    
    // Get unique categories and tags (would need to maintain separate sets for this)
    // For now, return empty arrays
    return {
      total,
      published,
      drafts,
      categories: [],
      tags: []
    }
  } catch (error) {
    console.error('Error fetching blog stats from KV:', error)
    return {
      total: 0,
      published: 0,
      drafts: 0,
      categories: [],
      tags: []
    }
  }
}

// Increment view count
export async function incrementBlogViews(id: string): Promise<void> {
  if (!isKVAvailable()) return
  
  try {
    const post = await getBlogPost(id)
    if (!post) return
    
    await kv.hset(`blog:${id}`, {
      ...post,
      views: (post.views || 0) + 1
    })
  } catch (error) {
    console.error('Error incrementing blog views:', error)
  }
}