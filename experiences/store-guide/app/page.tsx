import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getFeaturedFabrics, getFabricCategories } from '@/modules/fabrics/data/seed-data'
import { FabricCard } from '@/components/fabric-card'
import { Award, Star, Shield, Users, ArrowRight, Sparkles, Palette, Leaf } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Store Guide | The Hearth & Home Store',
  description: 'Browse our premium fabric collection. Handcrafted cushions and pillows made in Missouri.',
}

export default function StoreGuideHome() {
  const featuredFabrics = getFeaturedFabrics(6)
  const categories = getFabricCategories()

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2 bg-amber-500/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-full">
                <Award className="w-4 h-4" />
                <span className="text-sm">Featured on NBC TODAY Show</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-500/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-full">
                <Shield className="w-4 h-4" />
                <span className="text-sm">Good Housekeeping Approved</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-500/20 text-amber-200 border border-amber-400/30 px-3 py-1 rounded-full">
                <Users className="w-4 h-4" />
                <span className="text-sm">40+ Years Family-Owned</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
              <span className="text-2xl md:text-3xl font-medium text-gray-300 block mb-2">
                The Hearth & Home Store
              </span>
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Premium Fabric Collection
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              Discover our curated collection of luxury fabrics for custom cushions and pillows. 
              Expert guidance to help you choose the perfect fabric for your project.
            </p>

            {/* Social Proof */}
            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="ml-2 text-amber-200">4.9/5</span>
              </div>
              <div className="text-gray-300">
                <span className="font-semibold text-white">2,500+</span> Happy Customers
              </div>
              <div className="text-gray-300">
                <span className="font-semibold text-white">USA</span> Made
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/fabrics" 
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-colors"
              >
                Browse Fabric Collection
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                href="/products" 
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition-colors"
              >
                View Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-full mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Hand-selected fabrics from the world's finest mills
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4">
                <Palette className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Custom Design</h3>
              <p className="text-gray-600">
                Personalized cushions and pillows made to your specifications
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                <Leaf className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Eco-Friendly</h3>
              <p className="text-gray-600">
                Sustainable materials and responsible manufacturing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Fabrics Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Fabrics</h2>
            <p className="text-lg text-gray-600">
              Explore our most popular fabric selections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredFabrics.map((fabric) => (
              <FabricCard key={fabric.id} fabric={fabric} />
            ))}
          </div>

          <div className="text-center">
            <Link 
              href="/fabrics"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              View All Fabrics
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
            <p className="text-lg text-gray-600">
              Find the perfect fabric for your style
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/fabrics?category=${encodeURIComponent(category)}`}
                className="group p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all hover:border-gray-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {category}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Space?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get expert guidance and create custom pieces that reflect your style
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/fabrics"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Shopping
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              href="/blog"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white border-2 border-white/30 rounded-lg hover:bg-white/10 transition-colors"
            >
              Read Our Blog
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}