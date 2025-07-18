export interface DBPost {
  id: string
  date: string
  status: "Published" | "Scheduled" | "Draft"
  theme: string
  goal: string
  idea: string
  type: string
  copy: string
  keywords: string
  hashtags: string
  channels: string[]
  cta: string
  kpi: string
  notes: string
  boost: boolean
  event?: "launch" | "sale"
  createdAt: string
  updatedAt: string
}

export interface DBHeroCategory {
  id: string
  text: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface DBLaunchItem {
  id: string
  date: string
  title: string
  description: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface DBPromoItem {
  id: string
  title: string
  dates: string
  details: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface DBChannelStrategy {
  id: string
  platform: string
  points: string[]
  order: number
  createdAt: string
  updatedAt: string
}

export interface DBSEOKeyword {
  id: string
  text: string
  type: "primary" | "longTail"
  createdAt: string
  updatedAt: string
}

export interface DBBlogPost {
  id: string
  date: string
  title: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface DBCreativeGuideline {
  id: string
  text: string
  order: number
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PostsResponse {
  posts: DBPost[]
  total: number
}

export interface ProductsResponse {
  heroCategories: DBHeroCategory[]
  launchPipeline: DBLaunchItem[]
  promoFramework: DBPromoItem[]
}

export interface StrategyResponse {
  channels: DBChannelStrategy[]
  seoKeywords: DBSEOKeyword[]
  blogPosts: DBBlogPost[]
  creativeGuidelines: DBCreativeGuideline[]
}
