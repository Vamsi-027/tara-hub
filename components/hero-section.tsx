import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { config } from '@/lib/config'

export function HeroSection() {
  return (
    <section className="relative bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/luxury-fabric-showroom.png"
          alt="Luxury fabric showroom"
          fill
          className="object-cover opacity-60"
          priority
        />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            Premium Fabrics for
            <span className="block text-amber-400">Exceptional Interiors</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Discover our curated collection of luxury fabrics from the world's finest mills. 
            Perfect for interior designers and discerning homeowners.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/fabrics">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-3">
                Browse Collection
              </Button>
            </Link>
            <Link href={config.etsyFabricListingUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-3 bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:border-amber-600">
                Request Samples
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
