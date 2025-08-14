import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, User, ArrowRight } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { blogPosts } from '@/lib/blog-data'

export const metadata: Metadata = {
  title: 'Blog | Custom Cushion Tips & Home Decor Ideas | The Hearth & Home Store',
  description: 'Expert tips on custom cushions, fabric selection, home decor, and seasonal styling. Learn from 40+ years of craftsmanship experience.',
  keywords: 'custom cushions blog, home decor tips, fabric selection guide, seasonal decorating, interior design blog',
  openGraph: {
    title: 'The Hearth & Home Store Blog',
    description: 'Expert tips and inspiration for custom cushions and home decor',
    type: 'website',
  }
}

export default function BlogPage() {
  const sortedPosts = [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-amber-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              The Cushion Craft Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Expert tips, design inspiration, and everything you need to know about custom cushions, 
              home decor, and creating beautiful living spaces.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {sortedPosts.length > 0 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href={`/blog/${sortedPosts[0].slug}`}>
              <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="relative h-64 lg:h-full">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-400 opacity-75" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">Featured Article</span>
                    </div>
                  </div>
                  <div className="p-8 lg:p-12">
                    <Badge className="mb-4 bg-amber-100 text-amber-800">
                      {sortedPosts[0].category}
                    </Badge>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {sortedPosts[0].title}
                    </h2>
                    <p className="text-gray-600 mb-6 line-clamp-3">
                      {sortedPosts[0].excerpt}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(sortedPosts[0].publishedAt).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{sortedPosts[0].readTime} min read</span>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-600 font-semibold">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedPosts.slice(1).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-amber-700 font-semibold text-lg text-center px-4">
                        {post.title}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <Badge variant="outline" className="mb-3">
                      {post.category}
                    </Badge>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{post.author.name}</span>
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
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from(new Set(blogPosts.map(post => post.category))).map((category) => (
              <Link 
                key={category} 
                href={`/blog/category/${category.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-gray-50 hover:bg-amber-50 rounded-lg p-6 text-center transition-colors duration-200"
              >
                <h3 className="font-semibold text-gray-900">{category}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {blogPosts.filter(post => post.category === category).length} articles
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-amber-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Get Design Tips & Special Offers
          </h2>
          <p className="text-xl text-amber-50 mb-8">
            Join our newsletter for exclusive cushion care tips, seasonal decor ideas, and special discounts.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}