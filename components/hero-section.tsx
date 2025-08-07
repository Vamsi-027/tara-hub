import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative bg-gray-900 text-white">
      <div className="absolute inset-0">
        <Image
          src="/luxury-fabric-showroom.png"
          alt="Luxury fabric showroom"
          fill
          className="object-cover opacity-60"
        />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Premium Fabrics for
            <span className="block text-amber-400">Exceptional Interiors</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Discover our curated collection of luxury fabrics from the world's finest mills. 
            Perfect for interior designers, architects, and discerning homeowners.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/fabrics">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                Explore Collection
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900">
              Request Consultation
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
