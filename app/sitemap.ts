import { MetadataRoute } from 'next'
import { blogPosts } from '@/modules/blog'
import { fabricSeedData } from '@/modules/fabrics/data/seed-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tara-hub.vercel.app'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/fabrics`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ]
  
  // Blog posts
  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))
  
  // Fabric detail pages
  const fabricPages = fabricSeedData.map((fabric) => ({
    url: `${baseUrl}/fabric/${fabric.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))
  
  return [...staticPages, ...blogPages, ...fabricPages]
}