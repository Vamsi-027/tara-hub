import { kvClient, isKVAvailable } from './kv-client'
import {
  type Post,
  type Product,
  type Strategy,
  type Fabric,
} from './types'
import { memoryStore } from './memory-store'

// Browser-compatible UUID generation
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers and Node.js 16.7+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Re-export kv client for backward compatibility
export const kv = kvClient

// --- Inferred Types (as they were not in lib/types.ts) ---
// It's recommended to move these to a central types file.
export interface HeroCategory { id: string; name: string; }
export interface LaunchItem { id: string; name: string; launchDate: string; }
export interface PromoItem { id: string; name: string; discount: number; }
export interface ChannelStrategy { id: string; channel: string; strategy: string; }
export interface SEOKeyword { id: string; keyword: string; volume: number; }
export interface BlogPost { id:string; title: string; content: string; }
export interface CreativeGuideline { id: string; guideline: string; }

import type {
 DBPost,
 DBHeroCategory,
 DBLaunchItem,
 DBPromoItem,
 DBChannelStrategy,
 DBSEOKeyword,
 DBBlogPost,
 DBCreativeGuideline,
} from "./db-schema"
import {
 seedPosts,
 seedHeroCategories,
 seedLaunchItems,
 seedPromoItems,
 seedChannelStrategies,
 seedSEOKeywords,
 seedBlogPosts,
 seedCreativeGuidelines,
} from "./seed-data"

// KV Keys
const KEYS = {
 POSTS: "posts",
 HERO_CATEGORIES: "hero_categories",
 LAUNCH_PIPELINE: "launch_pipeline",
 PROMO_FRAMEWORK: "promo_framework",
 CHANNEL_STRATEGIES: "channel_strategies",
 SEO_KEYWORDS: "seo_keywords",
 BLOG_POSTS: "blog_posts",
 CREATIVE_GUIDELINES: "creative_guidelines",
} as const

// Fallback data store (in-memory for demo purposes)
const fallbackData = {
 posts: new Map<string, DBPost>(),
 heroCategories: new Map<string, DBHeroCategory>(),
 launchItems: new Map<string, DBLaunchItem>(),
 promoItems: new Map<string, DBPromoItem>(),
 channelStrategies: new Map<string, DBChannelStrategy>(),
 seoKeywords: new Map<string, DBSEOKeyword>(),
 blogPosts: new Map<string, DBBlogPost>(),
 creativeGuidelines: new Map<string, DBCreativeGuideline>(),
}

// Initialize fallback data
const initializeFallbackData = () => {
 if (fallbackData.posts.size === 0) {
   // Initialize with seed data
   seedPosts.forEach((post, index) => {
     const id = `post_${Date.now()}_${index}`
     const now = new Date().toISOString()
     fallbackData.posts.set(id, { ...post, id, createdAt: now, updatedAt: now })
   })

   seedHeroCategories.forEach((category, index) => {
     const id = `hero_${Date.now()}_${index}`
     const now = new Date().toISOString()
     fallbackData.heroCategories.set(id, { ...category, id, createdAt: now, updatedAt: now })
   })

   seedLaunchItems.forEach((item, index) => {
     const id = `launch_${Date.now()}_${index}`
     const now = new Date().toISOString()
     fallbackData.launchItems.set(id, { ...item, id, createdAt: now, updatedAt: now })
   })

   seedPromoItems.forEach((item, index) => {
     const id = `promo_${Date.now()}_${index}`
     const now = new Date().toISOString()
     fallbackData.promoItems.set(id, { ...item, id, createdAt: now, updatedAt: now })
   })

   seedChannelStrategies.forEach((strategy, index) => {
     const id = `channel_${Date.now()}_${index}`
     const now = new Date().toISOString()
     fallbackData.channelStrategies.set(id, { ...strategy, id, createdAt: now, updatedAt: now })
   })

   seedSEOKeywords.forEach((keyword, index) => {
     const id = `seo_${Date.now()}_${index}`
     const now = new Date().toISOString()
     fallbackData.seoKeywords.set(id, { ...keyword, id, createdAt: now, updatedAt: now })
   })

   seedBlogPosts.forEach((post, index) => {
     const id = `blog_${Date.now()}_${index}`
     const now = new Date().toISOString()
     fallbackData.blogPosts.set(id, { ...post, id, createdAt: now, updatedAt: now })
   })

   seedCreativeGuidelines.forEach((guideline, index) => {
     const id = `creative_${Date.now()}_${index}`
     const now = new Date().toISOString()
     fallbackData.creativeGuidelines.set(id, { ...guideline, id, createdAt: now, updatedAt: now })
   })
 }
}

// --- Post Functions ---

export async function createPost(postData: Omit<Post, 'id'>): Promise<Post> {
  const id = generateUUID()
  const post: Post = { id, ...postData }
  
  if (!isKVAvailable()) {
    // Use in-memory store when KV is not available
    console.log('KV not available, using in-memory store')
    return memoryStore.setPost(id, post)
  }
  
  try {
    const id = generateUUID()
    const post: Post = { id, ...postData }
    await kv.hset(`post:${id}`, post)
    await kv.zadd('posts_by_date', { score: Date.now(), member: id })
    return post
  } catch (error) {
    console.error('Error creating post in KV:', error)
    throw error
  }
}

export async function getPost(id: string): Promise<Post | null> {
  if (!isKVAvailable()) {
    return memoryStore.getPost(id)
  }
  return await kv.hgetall(`post:${id}`)
}

export async function getAllPosts(): Promise<Post[]> {
  if (!isKVAvailable()) {
    // Return posts from in-memory store when KV is not available
    return memoryStore.getAllPosts()
  }
  
  try {
    // Use the new KV client with built-in retry and timeout
    const postIds = await kvClient.zrange('posts_by_date', 0, -1, { rev: true })
    
    // If KV operation failed, fall back to memory store
    if (!postIds || postIds.length === 0) {
      const memPosts = memoryStore.getAllPosts()
      if (memPosts.length > 0) {
        console.log('Using in-memory store for posts (KV unavailable)')
        return memPosts
      }
      return []
    }

    const pipeline = kvClient.pipeline()
    postIds.forEach(id => pipeline.hgetall(`post:${id}`))
    const results = (await pipeline.exec()) as Post[]
    return results.filter(Boolean)
  } catch (error) {
    console.error('Error fetching posts from KV, using fallback:', error)
    // Fall back to memory store on any error
    return memoryStore.getAllPosts()
  }
}

export async function updatePost(id: string, postData: Partial<Post>): Promise<Post | null> {
    if (!isKVAvailable()) {
      const post = memoryStore.getPost(id)
      if (!post) return null
      const updatedPost = { ...post, ...postData, updatedAt: new Date().toISOString() }
      return memoryStore.setPost(id, updatedPost)
    }
    const post = await getPost(id)
    if (!post) return null
    const updatedPost = { ...post, ...postData, updatedAt: new Date().toISOString() }
    await kv.hset(`post:${id}`, updatedPost)
    return updatedPost
}

export async function deletePost(id: string): Promise<void> {
    if (!isKVAvailable()) {
      memoryStore.deletePost(id)
      return
    }
    await kv.del(`post:${id}`)
    await kv.zrem('posts_by_date', id)
}

// --- Generic CRUD Functions ---

async function createItem<T>(
  itemData: Omit<T, 'id'>,
  keyPrefix: string
): Promise<T> {
  if (!isKVAvailable()) {
    const id = generateUUID()
    const item = { id, ...itemData } as T
    console.log(`KV not available, returning mock ${keyPrefix}:`, item)
    return item
  }
  
  try {
    const id = generateUUID()
    const item = { id, ...itemData } as T
    await kv.hset(`${keyPrefix}:${id}`, item)
    return item
  } catch (error) {
    console.error(`Error creating ${keyPrefix} in KV:`, error)
    throw error
  }
}

async function getAllItems<T>(keyPrefix: string): Promise<T[]> {
    if (!isKVAvailable()) {
      return []
    }
    
    try {
      const keys = await kv.keys(`${keyPrefix}:*`)
      if (keys.length === 0) return []
      const pipeline = kv.pipeline()
      keys.forEach(key => pipeline.hgetall(key))
      return (await pipeline.exec()) as T[]
    } catch (error) {
      console.error(`Error fetching ${keyPrefix} from KV:`, error)
      return []
    }
}

// --- HeroCategory Functions ---
export const createHeroCategory = (data: Omit<HeroCategory, 'id'>) => createItem<HeroCategory>(data, 'hero_category')
export const getAllHeroCategories = () => getAllItems<HeroCategory>('hero_category')

// --- LaunchItem Functions ---
export const createLaunchItem = (data: Omit<LaunchItem, 'id'>) => createItem<LaunchItem>(data, 'launch_item')
export const getAllLaunchItems = () => getAllItems<LaunchItem>('launch_item')

// --- PromoItem Functions ---
export const createPromoItem = (data: Omit<PromoItem, 'id'>) => createItem<PromoItem>(data, 'promo_item')
export const getAllPromoItems = () => getAllItems<PromoItem>('promo_item')

// --- ChannelStrategy Functions ---
export const createChannelStrategy = (data: Omit<ChannelStrategy, 'id'>) => createItem<ChannelStrategy>(data, 'channel_strategy')
export const getAllChannelStrategies = () => getAllItems<ChannelStrategy>('channel_strategy')

// --- SEOKeyword Functions ---
export const createSEOKeyword = (data: Omit<SEOKeyword, 'id'>) => createItem<SEOKeyword>(data, 'seo_keyword')
export const getAllSEOKeywords = () => getAllItems<SEOKeyword>('seo_keyword')

// --- BlogPost Functions ---
export const createBlogPost = (data: Omit<BlogPost, 'id'>) => createItem<BlogPost>(data, 'blog_post')
export const getAllBlogPosts = () => getAllItems<BlogPost>('blog_post')

// --- CreativeGuideline Functions ---
export const createCreativeGuideline = (data: Omit<CreativeGuideline, 'id'>) => createItem<CreativeGuideline>(data, 'creative_guideline')
export const getAllCreativeGuidelines = () => getAllItems<CreativeGuideline>('creative_guideline')
