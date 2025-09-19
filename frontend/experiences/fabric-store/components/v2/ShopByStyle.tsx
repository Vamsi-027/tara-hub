'use client'

import { ArrowRight } from 'lucide-react'

interface Style {
  id: string
  name: string
  description: string
  image: string
  color: string
}

const styles: Style[] = [
  {
    id: 'modern',
    name: 'Modern & Minimalist',
    description: 'Clean lines, neutral palettes',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    color: 'from-gray-600 to-gray-800'
  },
  {
    id: 'traditional',
    name: 'Traditional & Classic',
    description: 'Timeless patterns, rich textures',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    color: 'from-amber-600 to-amber-800'
  },
  {
    id: 'bohemian',
    name: 'Bohemian & Eclectic',
    description: 'Bold colors, mixed patterns',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400',
    color: 'from-purple-600 to-pink-600'
  },
  {
    id: 'coastal',
    name: 'Coastal & Nautical',
    description: 'Light fabrics, ocean hues',
    image: 'https://images.unsplash.com/photo-1505843795480-5cfb3c03f6ff?w=400',
    color: 'from-blue-500 to-cyan-600'
  }
]

interface ShopByStyleProps {
  selectedStyles: string[]
  onStyleChange: (styles: string[]) => void
}

export function ShopByStyle({ selectedStyles, onStyleChange }: ShopByStyleProps) {
  const toggleStyle = (styleId: string) => {
    if (selectedStyles.includes(styleId)) {
      onStyleChange(selectedStyles.filter(s => s !== styleId))
    } else {
      onStyleChange([...selectedStyles, styleId])
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Shop by Style</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
          View all
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {styles.map((style) => {
          const isSelected = selectedStyles.includes(style.id)

          return (
            <button
              key={style.id}
              onClick={() => toggleStyle(style.id)}
              className={`
                group relative overflow-hidden rounded-lg transition-all duration-300
                ${isSelected
                  ? 'ring-2 ring-blue-500 shadow-lg scale-[0.98]'
                  : 'hover:shadow-md'
                }
              `}
            >
              {/* Background Image */}
              <div
                className="aspect-[16/9] bg-cover bg-center"
                style={{ backgroundImage: `url(${style.image})` }}
              >
                {/* Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-80`} />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-4 text-white">
                  <h4 className="font-semibold text-sm mb-1">{style.name}</h4>
                  <p className="text-xs opacity-90">{style.description}</p>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}