import { kv } from "@vercel/kv"
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

// Check if KV is available
const isKVAvailable = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
}

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

// Posts
export async function getAllPosts(): Promise<DBPost[]> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return Array.from(fallbackData.posts.values())
  }

  try {
    const posts = await kv.hgetall(KEYS.POSTS)
    return Object.values(posts || {}) as DBPost[]
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return Array.from(fallbackData.posts.values())
  }
}

export async function getPost(id: string): Promise<DBPost | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.posts.get(id) || null
  }

  try {
    return await kv.hget(KEYS.POSTS, id)
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.posts.get(id) || null
  }
}

export async function createPost(post: Omit<DBPost, "id" | "createdAt" | "updatedAt">): Promise<DBPost> {
  const id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  const newPost: DBPost = {
    ...post,
    id,
    createdAt: now,
    updatedAt: now,
  }

  if (!isKVAvailable()) {
    initializeFallbackData()
    fallbackData.posts.set(id, newPost)
    return newPost
  }

  try {
    await kv.hset(KEYS.POSTS, { [id]: newPost })
    return newPost
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    fallbackData.posts.set(id, newPost)
    return newPost
  }
}

export async function updatePost(id: string, updates: Partial<DBPost>): Promise<DBPost | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    const existingPost = fallbackData.posts.get(id)
    if (!existingPost) return null

    const updatedPost: DBPost = {
      ...existingPost,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.posts.set(id, updatedPost)
    return updatedPost
  }

  try {
    const existingPost = await getPost(id)
    if (!existingPost) return null

    const updatedPost: DBPost = {
      ...existingPost,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    await kv.hset(KEYS.POSTS, { [id]: updatedPost })
    return updatedPost
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    const existingPost = fallbackData.posts.get(id)
    if (!existingPost) return null

    const updatedPost: DBPost = {
      ...existingPost,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.posts.set(id, updatedPost)
    return updatedPost
  }
}

export async function deletePost(id: string): Promise<boolean> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.posts.delete(id)
  }

  try {
    const result = await kv.hdel(KEYS.POSTS, id)
    return result > 0
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.posts.delete(id)
  }
}

// Hero Categories
export async function getAllHeroCategories(): Promise<DBHeroCategory[]> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return Array.from(fallbackData.heroCategories.values()).sort((a, b) => a.order - b.order)
  }

  try {
    const categories = await kv.hgetall(KEYS.HERO_CATEGORIES)
    return Object.values(categories || {}).sort((a: any, b: any) => a.order - b.order) as DBHeroCategory[]
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return Array.from(fallbackData.heroCategories.values()).sort((a, b) => a.order - b.order)
  }
}

// Launch Pipeline
export async function getAllLaunchItems(): Promise<DBLaunchItem[]> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return Array.from(fallbackData.launchItems.values()).sort((a, b) => a.order - b.order)
  }

  try {
    const items = await kv.hgetall(KEYS.LAUNCH_PIPELINE)
    return Object.values(items || {}).sort((a: any, b: any) => a.order - b.order) as DBLaunchItem[]
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return Array.from(fallbackData.launchItems.values()).sort((a, b) => a.order - b.order)
  }
}

// Promo Framework
export async function getAllPromoItems(): Promise<DBPromoItem[]> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return Array.from(fallbackData.promoItems.values()).sort((a, b) => a.order - b.order)
  }

  try {
    const items = await kv.hgetall(KEYS.PROMO_FRAMEWORK)
    return Object.values(items || {}).sort((a: any, b: any) => a.order - b.order) as DBPromoItem[]
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return Array.from(fallbackData.promoItems.values()).sort((a, b) => a.order - b.order)
  }
}

// Channel Strategies
export async function getAllChannelStrategies(): Promise<DBChannelStrategy[]> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return Array.from(fallbackData.channelStrategies.values()).sort((a, b) => a.order - b.order)
  }

  try {
    const strategies = await kv.hgetall(KEYS.CHANNEL_STRATEGIES)
    return Object.values(strategies || {}).sort((a: any, b: any) => a.order - b.order) as DBChannelStrategy[]
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return Array.from(fallbackData.channelStrategies.values()).sort((a, b) => a.order - b.order)
  }
}

// SEO Keywords
export async function getAllSEOKeywords(): Promise<DBSEOKeyword[]> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return Array.from(fallbackData.seoKeywords.values())
  }

  try {
    const keywords = await kv.hgetall(KEYS.SEO_KEYWORDS)
    return Object.values(keywords || {}) as DBSEOKeyword[]
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return Array.from(fallbackData.seoKeywords.values())
  }
}

// Blog Posts
export async function getAllBlogPosts(): Promise<DBBlogPost[]> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return Array.from(fallbackData.blogPosts.values())
  }

  try {
    const posts = await kv.hgetall(KEYS.BLOG_POSTS)
    return Object.values(posts || {}) as DBBlogPost[]
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return Array.from(fallbackData.blogPosts.values())
  }
}

// Creative Guidelines
export async function getAllCreativeGuidelines(): Promise<DBCreativeGuideline[]> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return Array.from(fallbackData.creativeGuidelines.values()).sort((a, b) => a.order - b.order)
  }

  try {
    const guidelines = await kv.hgetall(KEYS.CREATIVE_GUIDELINES)
    return Object.values(guidelines || {}).sort((a: any, b: any) => a.order - b.order) as DBCreativeGuideline[]
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return Array.from(fallbackData.creativeGuidelines.values()).sort((a, b) => a.order - b.order)
  }
}

// Simplified functions for other entities (using fallback approach)
export async function createHeroCategory(
  category: Omit<DBHeroCategory, "id" | "createdAt" | "updatedAt">,
): Promise<DBHeroCategory> {
  const id = `hero_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  const newCategory: DBHeroCategory = { ...category, id, createdAt: now, updatedAt: now }

  if (!isKVAvailable()) {
    initializeFallbackData()
    fallbackData.heroCategories.set(id, newCategory)
    return newCategory
  }

  try {
    await kv.hset(KEYS.HERO_CATEGORIES, { [id]: newCategory })
    return newCategory
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    fallbackData.heroCategories.set(id, newCategory)
    return newCategory
  }
}

export async function createLaunchItem(
  item: Omit<DBLaunchItem, "id" | "createdAt" | "updatedAt">,
): Promise<DBLaunchItem> {
  const id = `launch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  const newItem: DBLaunchItem = { ...item, id, createdAt: now, updatedAt: now }

  if (!isKVAvailable()) {
    initializeFallbackData()
    fallbackData.launchItems.set(id, newItem)
    return newItem
  }

  try {
    await kv.hset(KEYS.LAUNCH_PIPELINE, { [id]: newItem })
    return newItem
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    fallbackData.launchItems.set(id, newItem)
    return newItem
  }
}

export async function createPromoItem(item: Omit<DBPromoItem, "id" | "createdAt" | "updatedAt">): Promise<DBPromoItem> {
  const id = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  const newItem: DBPromoItem = { ...item, id, createdAt: now, updatedAt: now }

  if (!isKVAvailable()) {
    initializeFallbackData()
    fallbackData.promoItems.set(id, newItem)
    return newItem
  }

  try {
    await kv.hset(KEYS.PROMO_FRAMEWORK, { [id]: newItem })
    return newItem
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    fallbackData.promoItems.set(id, newItem)
    return newItem
  }
}

export async function createChannelStrategy(
  strategy: Omit<DBChannelStrategy, "id" | "createdAt" | "updatedAt">,
): Promise<DBChannelStrategy> {
  const id = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  const newStrategy: DBChannelStrategy = { ...strategy, id, createdAt: now, updatedAt: now }

  if (!isKVAvailable()) {
    initializeFallbackData()
    fallbackData.channelStrategies.set(id, newStrategy)
    return newStrategy
  }

  try {
    await kv.hset(KEYS.CHANNEL_STRATEGIES, { [id]: newStrategy })
    return newStrategy
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    fallbackData.channelStrategies.set(id, newStrategy)
    return newStrategy
  }
}

export async function createSEOKeyword(
  keyword: Omit<DBSEOKeyword, "id" | "createdAt" | "updatedAt">,
): Promise<DBSEOKeyword> {
  const id = `seo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  const newKeyword: DBSEOKeyword = { ...keyword, id, createdAt: now, updatedAt: now }

  if (!isKVAvailable()) {
    initializeFallbackData()
    fallbackData.seoKeywords.set(id, newKeyword)
    return newKeyword
  }

  try {
    await kv.hset(KEYS.SEO_KEYWORDS, { [id]: newKeyword })
    return newKeyword
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    fallbackData.seoKeywords.set(id, newKeyword)
    return newKeyword
  }
}

export async function createBlogPost(post: Omit<DBBlogPost, "id" | "createdAt" | "updatedAt">): Promise<DBBlogPost> {
  const id = `blog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  const newPost: DBBlogPost = { ...post, id, createdAt: now, updatedAt: now }

  if (!isKVAvailable()) {
    initializeFallbackData()
    fallbackData.blogPosts.set(id, newPost)
    return newPost
  }

  try {
    await kv.hset(KEYS.BLOG_POSTS, { [id]: newPost })
    return newPost
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    fallbackData.blogPosts.set(id, newPost)
    return newPost
  }
}

export async function createCreativeGuideline(
  guideline: Omit<DBCreativeGuideline, "id" | "createdAt" | "updatedAt">,
): Promise<DBCreativeGuideline> {
  const id = `creative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  const newGuideline: DBCreativeGuideline = { ...guideline, id, createdAt: now, updatedAt: now }

  if (!isKVAvailable()) {
    initializeFallbackData()
    fallbackData.creativeGuidelines.set(id, newGuideline)
    return newGuideline
  }

  try {
    await kv.hset(KEYS.CREATIVE_GUIDELINES, { [id]: newGuideline })
    return newGuideline
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    fallbackData.creativeGuidelines.set(id, newGuideline)
    return newGuideline
  }
}
