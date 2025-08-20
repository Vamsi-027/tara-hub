import Link from 'next/link'
import { ArrowRight, Calendar, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getLatestBlogPosts } from '@/modules/blog'

export function BlogPreview() {
  const latestPosts = getLatestBlogPosts(3)

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Expert Tips & Inspiration
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover design ideas, care tips, and seasonal trends from our blog. 
            Learn from 40+ years of custom cushion expertise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {latestPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100 rounded-t-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <h3 className="text-amber-700 font-semibold text-center group-hover:scale-105 transition-transform duration-300">
                      {post.title}
                    </h3>
                  </div>
                </div>
                <CardContent className="p-6">
                  <Badge variant="outline" className="mb-3">
                    {post.category}
                  </Badge>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/blog">
            <Button size="lg" className="group">
              View All Articles
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}