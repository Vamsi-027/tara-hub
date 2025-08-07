import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { fabricSeedData } from '@/lib/fabric-seed-data'
import type { Fabric } from '@/lib/fabric-seed-data'

export function FeaturedFabrics() {
  // Get first 6 fabrics as featured
  const featuredFabrics: Fabric[] = fabricSeedData.slice(0, 6)

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Fabrics
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our handpicked selection of premium fabrics, chosen for their exceptional quality, 
            unique character, and versatile applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredFabrics.map((fabric) => (
            <Card key={fabric.id} className="group hover:shadow-xl transition-shadow duration-300">
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <Image
                  src={fabric.swatchImageUrl || "/placeholder.svg"}
                  alt={fabric.name}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">
                    {fabric.name}
                  </h3>
                  <Badge variant={fabric.inStock ? "default" : "secondary"} className="ml-2 flex-shrink-0">
                    {fabric.inStock ? "In Stock" : "MTO"}
                  </Badge>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {fabric.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {fabric.category && (
                    <Badge variant="outline" className="text-xs">
                      {fabric.category}
                    </Badge>
                  )}
                  {fabric.composition && (
                    <Badge variant="outline" className="text-xs">
                      {fabric.composition.split(',')[0]}
                    </Badge>
                  )}
                </div>

                <Link href={`/fabric/${fabric.id}`}>
                  <Button className="w-full">
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link href="/fabrics">
            <Button variant="outline" size="lg" className="px-8">
              View All Fabrics
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
