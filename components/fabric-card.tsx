"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Fabric } from "@/lib/fabric-seed-data"

interface FabricCardProps {
  fabric: Fabric;
}

export function FabricCard({ fabric }: FabricCardProps) {
  return (
    <Card key={fabric.id} className="group hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-square overflow-hidden rounded-t-lg">
        <Image
          src={fabric.swatchImageUrl}
          alt={fabric.name}
          width={300}
          height={300}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{fabric.name}</h3>
          <Badge variant={fabric.inStock ? "default" : "secondary"} className="ml-2 flex-shrink-0">
            {fabric.inStock ? "In Stock" : "MTO"}
          </Badge>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{fabric.description}</p>

        <div className="space-y-1 mb-3 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Composition:</span>
            <span className="text-gray-900 text-right">{fabric.composition}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Width:</span>
            <span className="text-gray-900">{fabric.width}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs">{fabric.category}</Badge>
          <Badge variant="outline" className="text-xs">{fabric.color}</Badge>
        </div>

        <div className="space-y-2">
          <Link href={`/fabric/${fabric.id}`}>
            <Button className="w-full" size="sm">View Details</Button>
          </Link>
          <Button variant="outline" className="w-full" size="sm">Request Sample</Button>
        </div>
      </CardContent>
    </Card>
  )
}