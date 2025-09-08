export interface BlogPost {
  id: string
  slug: string
  title: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  excerpt: string
  content: string
  publishedAt: string
  author: {
    name: string
    role?: string
  }
  tags: string[]
  category?: string
  readTime?: number
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'welcome-to-our-store',
    title: 'Welcome to Our Store',
    seoTitle: 'Welcome to The Hearth & Home Store',
    seoDescription: 'Discover our premium fabric collection and custom cushion services.',
    seoKeywords: ['fabric', 'cushions', 'home decor'],
    excerpt: 'Discover our premium fabric collection and custom cushion services.',
    content: 'Welcome to The Hearth & Home Store! We are excited to share our passion for quality fabrics and custom home decor with you.',
    publishedAt: '2024-01-15',
    author: {
      name: 'Store Team',
      role: 'Editorial'
    },
    tags: ['announcement', 'welcome'],
    category: 'News',
    readTime: 2
  },
  {
    id: '2',
    slug: 'choosing-the-right-fabric',
    title: 'How to Choose the Right Fabric',
    seoTitle: 'Fabric Selection Guide',
    seoDescription: 'Tips and tricks for selecting the perfect fabric for your project.',
    seoKeywords: ['fabric selection', 'tips', 'guide'],
    excerpt: 'Tips and tricks for selecting the perfect fabric for your project.',
    content: 'Choosing the right fabric can make all the difference in your home decor project. Here are our expert tips...',
    publishedAt: '2024-01-20',
    author: {
      name: 'Design Team',
      role: 'Designers'
    },
    tags: ['tips', 'fabric', 'guide'],
    category: 'Guides',
    readTime: 5
  }
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug)
}

export function getAllBlogPosts(): BlogPost[] {
  return blogPosts
}

export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  return blogPosts
    .filter(post => post.slug !== currentSlug)
    .slice(0, limit)
}