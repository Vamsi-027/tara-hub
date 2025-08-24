// Database schema types for cache providers
export interface DBPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBHeroCategory {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBLaunchItem {
  id: string;
  name: string;
  launchDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBPromoItem {
  id: string;
  name: string;
  discount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBChannelStrategy {
  id: string;
  channel: string;
  strategy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBSEOKeyword {
  id: string;
  keyword: string;
  volume: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBBlogPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBCreativeGuideline {
  id: string;
  guideline: string;
  createdAt: string;
  updatedAt: string;
}