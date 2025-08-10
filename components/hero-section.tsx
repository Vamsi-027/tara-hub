import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { config } from '@/lib/config'
import { Award, Star, Shield, Users } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/luxury-fabric-showroom.png"
          alt="Custom cushions and pillows showcase"
          fill
          className="object-cover opacity-60"
          priority
        />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-3xl">
          {/* Trust Badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Badge className="bg-amber-500/20 text-amber-200 border-amber-400 px-3 py-1">
              <Award className="w-4 h-4 mr-2" />
              Featured on NBC TODAY Show
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-200 border-amber-400 px-3 py-1">
              <Shield className="w-4 h-4 mr-2" />
              Good Housekeeping Approved
            </Badge>
            <Badge className="bg-amber-500/20 text-amber-200 border-amber-400 px-3 py-1">
              <Users className="w-4 h-4 mr-2" />
              40+ Years Family-Owned
            </Badge>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            <span className="text-2xl md:text-3xl font-medium text-gray-100 block mb-2">Hearth & Home</span>
            <span className="text-5xl md:text-7xl font-bold text-white block">Fabric Info</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
            Discover our curated collection of 100+ premium fabrics for custom cushions and pillows. 
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
            <Link href="/fabrics">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-3">
                Design Your Cushion
              </Button>
            </Link>
            <Link href={config.etsyFabricListingUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-3 bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:border-amber-600">
                View Fabric Library
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent"></div>
    </section>
  )
}
