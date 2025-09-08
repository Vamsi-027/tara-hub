'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Heart, Share2, Package } from 'lucide-react'

export default function ProductDetails({ product, rawProduct }: any) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Images */}
      <div>
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
          <Image
            src={product.images[selectedImage] || product.imageUrl}
            alt={product.name}
            width={600}
            height={600}
            className="object-cover w-full h-full"
          />
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`aspect-square bg-gray-100 rounded border-2 ${
                  idx === selectedImage ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <Image src={img} alt="" width={100} height={100} className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div>
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <p className="text-gray-600 mb-6">{product.description}</p>
        
        <div className="mb-6">
          <p className="text-3xl font-bold text-blue-600">
            ${product.pricePerYard}/yard
          </p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="w-20 px-3 py-2 border rounded"
          />
          <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
          <button className="p-3 border rounded-lg hover:bg-gray-50">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Specifications */}
        <div className="border-t pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">Category</p>
              <p>{product.category}</p>
            </div>
            <div>
              <p className="font-semibold">SKU</p>
              <p>{product.sku}</p>
            </div>
            <div>
              <p className="font-semibold">Width</p>
              <p>{product.width}" </p>
            </div>
            <div>
              <p className="font-semibold">Weight</p>
              <p>{product.weight} oz/yd²</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}