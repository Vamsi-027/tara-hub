'use client'

import { Sparkles, Leaf, Crown, Snowflake } from 'lucide-react'

interface Collection {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  count: number
  badge?: string
  gradient: string
}

const collections: Collection[] = [
  {
    id: 'luxury',
    name: 'Luxury Collection',
    description: 'Premium imported fabrics',
    icon: <Crown className="w-5 h-5" />,
    count: 48,
    badge: 'Exclusive',
    gradient: 'from-yellow-400 to-amber-600'
  },
  {
    id: 'sustainable',
    name: 'Eco-Friendly',
    description: 'Sustainable & organic materials',
    icon: <Leaf className="w-5 h-5" />,
    count: 36,
    badge: 'New',
    gradient: 'from-green-400 to-emerald-600'
  },
  {
    id: 'seasonal',
    name: 'Winter 2024',
    description: 'Seasonal favorites',
    icon: <Snowflake className="w-5 h-5" />,
    count: 24,
    gradient: 'from-blue-400 to-indigo-600'
  },
  {
    id: 'designer',
    name: 'Designer Picks',
    description: 'Curated by experts',
    icon: <Sparkles className="w-5 h-5" />,
    count: 52,
    badge: 'Featured',
    gradient: 'from-purple-400 to-pink-600'
  }
]

interface ShopByCollectionProps {
  selectedCollections: string[]
  onCollectionChange: (collections: string[]) => void
}

export function ShopByCollection({ selectedCollections, onCollectionChange }: ShopByCollectionProps) {
  const toggleCollection = (collectionId: string) => {
    if (selectedCollections.includes(collectionId)) {
      onCollectionChange(selectedCollections.filter(c => c !== collectionId))
    } else {
      onCollectionChange([...selectedCollections, collectionId])
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Featured Collections</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          Browse all →
        </button>
      </div>

      <div className="space-y-3">
        {collections.map((collection) => {
          const isSelected = selectedCollections.includes(collection.id)

          return (
            <button
              key={collection.id}
              onClick={() => toggleCollection(collection.id)}
              className={`
                w-full group relative overflow-hidden rounded-lg transition-all duration-300
                ${isSelected
                  ? 'ring-2 ring-blue-500 shadow-md'
                  : 'hover:shadow-lg'
                }
              `}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${collection.gradient} opacity-10`} />

              <div className="relative flex items-center justify-between p-4 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  {/* Icon with gradient background */}
                  <div className={`
                    p-2.5 rounded-lg bg-gradient-to-br ${collection.gradient}
                    text-white shadow-sm
                  `}>
                    {collection.icon}
                  </div>

                  {/* Content */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{collection.name}</h4>
                      {collection.badge && (
                        <span className={`
                          px-2 py-0.5 text-xs font-medium rounded-full
                          ${collection.badge === 'New' && 'bg-green-100 text-green-700'}
                          ${collection.badge === 'Exclusive' && 'bg-yellow-100 text-yellow-700'}
                          ${collection.badge === 'Featured' && 'bg-purple-100 text-purple-700'}
                        `}>
                          {collection.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{collection.description}</p>
                  </div>
                </div>

                {/* Count & Selection */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 font-medium">
                    {collection.count} items
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}