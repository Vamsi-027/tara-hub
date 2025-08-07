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

export async function getHeroCategory(id: string): Promise<DBHeroCategory | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.heroCategories.get(id) || null
  }

  try {
    return await kv.hget(KEYS.HERO_CATEGORIES, id)
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.heroCategories.get(id) || null
  }
}

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

export async function updateHeroCategory(id: string, updates: Partial<DBHeroCategory>): Promise<DBHeroCategory | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    const existingCategory = fallbackData.heroCategories.get(id)
    if (!existingCategory) return null

    const updatedCategory: DBHeroCategory = {
      ...existingCategory,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.heroCategories.set(id, updatedCategory)
    return updatedCategory
  }

  try {
    const existingCategory = await getHeroCategory(id)
    if (!existingCategory) return null

    const updatedCategory: DBHeroCategory = {
      ...existingCategory,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    await kv.hset(KEYS.HERO_CATEGORIES, { [id]: updatedCategory })
    return updatedCategory
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    const existingCategory = fallbackData.heroCategories.get(id)
    if (!existingCategory) return null

    const updatedCategory: DBHeroCategory = {
      ...existingCategory,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.heroCategories.set(id, updatedCategory)
    return updatedCategory
  }
}

export async function deleteHeroCategory(id: string): Promise<boolean> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.heroCategories.delete(id)
  }

  try {
    const result = await kv.hdel(KEYS.HERO_CATEGORIES, id)
    return result > 0
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.heroCategories.delete(id)
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

export async function getLaunchItem(id: string): Promise<DBLaunchItem | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.launchItems.get(id) || null
  }

  try {
    return await kv.hget(KEYS.LAUNCH_PIPELINE, id)
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.launchItems.get(id) || null
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

export async function updateLaunchItem(id: string, updates: Partial<DBLaunchItem>): Promise<DBLaunchItem | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    const existingItem = fallbackData.launchItems.get(id)
    if (!existingItem) return null

    const updatedItem: DBLaunchItem = {
      ...existingItem,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.launchItems.set(id, updatedItem)
    return updatedItem
  }

  try {
    const existingItem = await getLaunchItem(id)
    if (!existingItem) return null

    const updatedItem: DBLaunchItem = {
      ...existingItem,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    await kv.hset(KEYS.LAUNCH_PIPELINE, { [id]: updatedItem })
    return updatedItem
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    const existingItem = fallbackData.launchItems.get(id)
    if (!existingItem) return null

    const updatedItem: DBLaunchItem = {
      ...existingItem,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.launchItems.set(id, updatedItem)
    return updatedItem
  }
}

export async function deleteLaunchItem(id: string): Promise<boolean> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.launchItems.delete(id)
  }

  try {
    const result = await kv.hdel(KEYS.LAUNCH_PIPELINE, id)
    return result > 0
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.launchItems.delete(id)
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

export async function getPromoItem(id: string): Promise<DBPromoItem | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.promoItems.get(id) || null
  }

  try {
    return await kv.hget(KEYS.PROMO_FRAMEWORK, id)
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.promoItems.get(id) || null
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

export async function updatePromoItem(id: string, updates: Partial<DBPromoItem>): Promise<DBPromoItem | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    const existingItem = fallbackData.promoItems.get(id)
    if (!existingItem) return null

    const updatedItem: DBPromoItem = {
      ...existingItem,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.promoItems.set(id, updatedItem)
    return updatedItem
  }

  try {
    const existingItem = await getPromoItem(id)
    if (!existingItem) return null

    const updatedItem: DBPromoItem = {
      ...existingItem,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    await kv.hset(KEYS.PROMO_FRAMEWORK, { [id]: updatedItem })
    return updatedItem
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    const existingItem = fallbackData.promoItems.get(id)
    if (!existingItem) return null

    const updatedItem: DBPromoItem = {
      ...existingItem,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.promoItems.set(id, updatedItem)
    return updatedItem
  }
}

export async function deletePromoItem(id: string): Promise<boolean> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.promoItems.delete(id)
  }

  try {
    const result = await kv.hdel(KEYS.PROMO_FRAMEWORK, id)
    return result > 0
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.promoItems.delete(id)
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

export async function getChannelStrategy(id: string): Promise<DBChannelStrategy | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.channelStrategies.get(id) || null
  }

  try {
    return await kv.hget(KEYS.CHANNEL_STRATEGIES, id)
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.channelStrategies.get(id) || null
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

export async function updateChannelStrategy(id: string, updates: Partial<DBChannelStrategy>): Promise<DBChannelStrategy | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    const existingStrategy = fallbackData.channelStrategies.get(id)
    if (!existingStrategy) return null

    const updatedStrategy: DBChannelStrategy = {
      ...existingStrategy,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.channelStrategies.set(id, updatedStrategy)
    return updatedStrategy
  }

  try {
    const existingStrategy = await getChannelStrategy(id)
    if (!existingStrategy) return null

    const updatedStrategy: DBChannelStrategy = {
      ...existingStrategy,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    await kv.hset(KEYS.CHANNEL_STRATEGIES, { [id]: updatedStrategy })
    return updatedStrategy
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    const existingStrategy = fallbackData.channelStrategies.get(id)
    if (!existingStrategy) return null

    const updatedStrategy: DBChannelStrategy = {
      ...existingStrategy,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.channelStrategies.set(id, updatedStrategy)
    return updatedStrategy
  }
}

export async function deleteChannelStrategy(id: string): Promise<boolean> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.channelStrategies.delete(id)
  }

  try {
    const result = await kv.hdel(KEYS.CHANNEL_STRATEGIES, id)
    return result > 0
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.channelStrategies.delete(id)
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

export async function getSEOKeyword(id: string): Promise<DBSEOKeyword | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.seoKeywords.get(id) || null
  }

  try {
    return await kv.hget(KEYS.SEO_KEYWORDS, id)
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.seoKeywords.get(id) || null
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

export async function updateSEOKeyword(id: string, updates: Partial<DBSEOKeyword>): Promise<DBSEOKeyword | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    const existingKeyword = fallbackData.seoKeywords.get(id)
    if (!existingKeyword) return null

    const updatedKeyword: DBSEOKeyword = {
      ...existingKeyword,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.seoKeywords.set(id, updatedKeyword)
    return updatedKeyword
  }

  try {
    const existingKeyword = await getSEOKeyword(id)
    if (!existingKeyword) return null

    const updatedKeyword: DBSEOKeyword = {
      ...existingKeyword,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    await kv.hset(KEYS.SEO_KEYWORDS, { [id]: updatedKeyword })
    return updatedKeyword
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    const existingKeyword = fallbackData.seoKeywords.get(id)
    if (!existingKeyword) return null

    const updatedKeyword: DBSEOKeyword = {
      ...existingKeyword,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.seoKeywords.set(id, updatedKeyword)
    return updatedKeyword
  }
}

export async function deleteSEOKeyword(id: string): Promise<boolean> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.seoKeywords.delete(id)
  }

  try {
    const result = await kv.hdel(KEYS.SEO_KEYWORDS, id)
    return result > 0
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.seoKeywords.delete(id)
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

export async function getBlogPost(id: string): Promise<DBBlogPost | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.blogPosts.get(id) || null
  }

  try {
    return await kv.hget(KEYS.BLOG_POSTS, id)
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.blogPosts.get(id) || null
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

export async function updateBlogPost(id: string, updates: Partial<DBBlogPost>): Promise<DBBlogPost | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    const existingPost = fallbackData.blogPosts.get(id)
    if (!existingPost) return null

    const updatedPost: DBBlogPost = {
      ...existingPost,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.blogPosts.set(id, updatedPost)
    return updatedPost
  }

  try {
    const existingPost = await getBlogPost(id)
    if (!existingPost) return null

    const updatedPost: DBBlogPost = {
      ...existingPost,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    await kv.hset(KEYS.BLOG_POSTS, { [id]: updatedPost })
    return updatedPost
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    const existingPost = fallbackData.blogPosts.get(id)
    if (!existingPost) return null

    const updatedPost: DBBlogPost = {
      ...existingPost,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.blogPosts.set(id, updatedPost)
    return updatedPost
  }
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.blogPosts.delete(id)
  }

  try {
    const result = await kv.hdel(KEYS.BLOG_POSTS, id)
    return result > 0
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.blogPosts.delete(id)
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

export async function getCreativeGuideline(id: string): Promise<DBCreativeGuideline | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.creativeGuidelines.get(id) || null
  }

  try {
    return await kv.hget(KEYS.CREATIVE_GUIDELINES, id)
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.creativeGuidelines.get(id) || null
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

export async function updateCreativeGuideline(id: string, updates: Partial<DBCreativeGuideline>): Promise<DBCreativeGuideline | null> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    const existingGuideline = fallbackData.creativeGuidelines.get(id)
    if (!existingGuideline) return null

    const updatedGuideline: DBCreativeGuideline = {
      ...existingGuideline,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.creativeGuidelines.set(id, updatedGuideline)
    return updatedGuideline
  }

  try {
    const existingGuideline = await getCreativeGuideline(id)
    if (!existingGuideline) return null

    const updatedGuideline: DBCreativeGuideline = {
      ...existingGuideline,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    await kv.hset(KEYS.CREATIVE_GUIDELINES, { [id]: updatedGuideline })
    return updatedGuideline
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    const existingGuideline = fallbackData.creativeGuidelines.get(id)
    if (!existingGuideline) return null

    const updatedGuideline: DBCreativeGuideline = {
      ...existingGuideline,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    }
    fallbackData.creativeGuidelines.set(id, updatedGuideline)
    return updatedGuideline
  }
}

export async function deleteCreativeGuideline(id: string): Promise<boolean> {
  if (!isKVAvailable()) {
    initializeFallbackData()
    return fallbackData.creativeGuidelines.delete(id)
  }

  try {
    const result = await kv.hdel(KEYS.CREATIVE_GUIDELINES, id)
    return result > 0
  } catch (error) {
    console.warn("KV error, falling back to in-memory data:", error)
    initializeFallbackData()
    return fallbackData.creativeGuidelines.delete(id)
  }
}