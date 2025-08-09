import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, User, ArrowLeft, Facebook, Twitter, Linkedin, Mail } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getBlogPost, getRelatedPosts, blogPosts } from '@/lib/blog-data'

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getBlogPost(params.slug)
  
  if (!post) {
    return {
      title: 'Blog Post Not Found',
    }
  }

  return {
    title: post.seoTitle || `${post.title} | The Hearth & Home Store Blog`,
    description: post.seoDescription || post.excerpt,
    keywords: post.seoKeywords?.join(', ') || post.tags.join(', '),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    }
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPost(params.slug)
  
  if (!post) {
    notFound()
  }

  const relatedPosts = getRelatedPosts(post.id, 3)
  
  // Simple markdown to HTML conversion (for basic formatting)
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('### ')) {
          return `<h3 class="text-xl font-semibold text-gray-900 mt-6 mb-3">${line.substring(4)}</h3>`
        }
        if (line.startsWith('## ')) {
          return `<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">${line.substring(3)}</h2>`
        }
        if (line.startsWith('# ')) {
          return `<h1 class="text-3xl font-bold text-gray-900 mb-6">${line.substring(2)}</h1>`
        }
        
        // Lists
        if (line.startsWith('- ')) {
          return `<li class="ml-6 mb-2 text-gray-700">• ${line.substring(2)}</li>`
        }
        if (line.match(/^\d+\. /)) {
          return `<li class="ml-6 mb-2 text-gray-700">${line}</li>`
        }
        
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        
        // Paragraphs
        if (line.trim() === '') {
          return '<br />'
        }
        
        return `<p class="text-gray-700 mb-4 leading-relaxed">${line}</p>`
      })
      .join('')
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/blog" className="text-gray-500 hover:text-gray-700">Blog</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900">{post.title}</span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href="/blog" 
            className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
          
          <Badge className="mb-4 bg-amber-100 text-amber-800">
            {post.category}
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <div>
                <span className="font-medium">{post.author.name}</span>
                {post.author.role && (
                  <span className="text-gray-500"> · {post.author.role}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{post.readTime} min read</span>
            </div>
          </div>

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
          />

          {/* Tags */}
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Share this article:</h3>
            <div className="flex gap-4">
              <Button variant="outline" size="icon">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                    <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100">
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <span className="text-amber-700 font-semibold text-center">
                          {relatedPost.title}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-3">
                        {relatedPost.category}
                      </Badge>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {relatedPost.excerpt}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-amber-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Create Your Custom Cushions?
          </h2>
          <p className="text-xl text-amber-50 mb-8">
            Turn inspiration into reality with our expert team and 100+ fabric options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/fabrics">
              <Button size="lg" className="bg-white text-amber-600 hover:bg-gray-100">
                Browse Fabrics
              </Button>
            </Link>
            <Link href="/#contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-amber-600">
                Get a Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}