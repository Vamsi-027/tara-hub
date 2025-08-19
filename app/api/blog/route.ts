import { NextRequest, NextResponse } from 'next/server'
import {
  createBlogPost,
  getAllBlogPosts,
  BlogPostModel
} from '@/lib/blog-model'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'draft' | 'published' | 'archived' | null
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const posts = await getAllBlogPosts({
      status: status || undefined,
      category: category || undefined,
      tag: tag || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await null
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Create blog post data
    const postData: Omit<BlogPostModel, 'id' | 'createdAt' | 'updatedAt'> = {
      slug: body.slug || '',
      title: body.title,
      excerpt: body.excerpt || '',
      content: body.content,
      featuredImage: body.featuredImage,
      author: body.author || {
        name: session.user?.name || 'Admin',
        email: session.user?.email || undefined
      },
      category: body.category || 'Uncategorized',
      tags: body.tags || [],
      status: body.status || 'draft',
      publishedAt: body.status === 'published' ? new Date().toISOString() : undefined,
      scheduledAt: body.scheduledAt,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
      seoKeywords: body.seoKeywords,
      createdBy: session.user?.email || undefined,
      updatedBy: session.user?.email || undefined
    }

    const post = await createBlogPost(postData)
    
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}