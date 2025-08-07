"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { fabricSeedData } from "@/lib/fabric-seed-data"
import Link from "next/link"
import Image from "next/image"

export function FeaturedFabrics() {
  const featuredFabrics = fabricSeedData.filter(fabric => fabric.isFeatured)

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Fabrics</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our curated selection of premium fabrics, each chosen for their exceptional quality and design.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredFabrics.map((fabric) => (
            <Card key={fabric.id} className="group hover:shadow-lg transition-shadow duration-300">
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
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{fabric.name}</h3>
                  <Badge variant={fabric.inStock ? "default" : "secondary"}>
                    {fabric.inStock ? "In Stock" : "Made to Order"}
                  </Badge>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">{fabric.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Composition:</span>
                    <span className="text-gray-900">{fabric.composition}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Width:</span>
                    <span className="text-gray-900">{fabric.width}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Origin:</span>
                    <span className="text-gray-900">{fabric.origin}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  <Badge variant="outline" className="text-xs">{fabric.category}</Badge>
                  <Badge variant="outline" className="text-xs">{fabric.color}</Badge>
                  <Badge variant="outline" className="text-xs">{fabric.pattern}</Badge>
                </div>

                <div className="space-y-2">
                  <Link href={`/fabric/${fabric.id}`}>
                    <Button className="w-full">View Details</Button>
                  </Link>
                  <Button variant="outline" className="w-full">Request Sample</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/fabrics">
            <Button variant="outline" size="lg">
              View All Fabrics
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
