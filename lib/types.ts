export interface Post {
  id: number
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
}

export interface HeroCategory {
  id: number
  text: string
}

export interface LaunchItem {
  id: number
  date: string
  title: string
  description: string
}

export interface PromoItem {
  id: number
  title: string
  dates: string
  details: string
}

export interface ChannelStrategy {
  id: number
  platform: string
  points: string[]
}

export interface SEOKeyword {
  id: number
  text: string
}

export interface BlogPost {
  id: number
  date: string
  title: string
}

export interface CreativeGuideline {
  id: number
  text: string
}

export interface Database {
  calendar: Post[]
  products: {
    heroCategories: HeroCategory[]
    launchPipeline: LaunchItem[]
    promoFramework: PromoItem[]
  }
  strategy: {
    channels: ChannelStrategy[]
    seo: {
      primary: SEOKeyword[]
      longTail: SEOKeyword[]
      blogPosts: BlogPost[]
    }
    creative: CreativeGuideline[]
  }
}
