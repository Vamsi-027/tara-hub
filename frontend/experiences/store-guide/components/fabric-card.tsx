import Image from 'next/image'
import Link from 'next/link'
import { Fabric } from '@/lib/api-client'

interface FabricCardProps {
  fabric: Fabric
}

export function FabricCard({ fabric }: FabricCardProps) {
  const imageUrl = fabric.imageUrl || '/placeholder.jpg'

  return (
    <Link href={`/fabric/${fabric.id}`} className="group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={fabric.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {fabric.status === 'active' && fabric.collection && (
            <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
              {fabric.collection}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">{fabric.name}</h3>
          {fabric.manufacturer && (
            <p className="text-sm text-gray-500 truncate">{fabric.manufacturer}</p>
          )}
          {fabric.category && (
            <p className="text-xs text-gray-400 truncate">{fabric.category}</p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {fabric.width && (
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                {fabric.width}
              </span>
            )}
            {fabric.durability && (
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {fabric.durability}
              </span>
            )}
          </div>
          {fabric.origin && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Origin:</span>
              <span className="text-xs">{fabric.origin}</span>
            </div>
          )}
          {/* Display key features if available */}
          <div className="mt-2 flex gap-1 flex-wrap">
            {fabric.isPetFriendly && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                Pet Friendly
              </span>
            )}
            {fabric.isStainResistant && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                Stain Resistant
              </span>
            )}
            {fabric.isOutdoorSafe && (
              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                Outdoor
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}