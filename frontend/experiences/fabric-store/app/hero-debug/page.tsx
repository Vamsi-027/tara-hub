'use client'

import { useState, useEffect } from 'react'
import { useHeroCarousel } from '../../hooks/useHeroCarousel'

export default function HeroDebug() {
  const { slides, loading, error } = useHeroCarousel()
  const [apiTest, setApiTest] = useState(null)

  useEffect(() => {
    // Test direct API call
    fetch('/api/hero-slides')
      .then(res => res.json())
      .then(data => setApiTest(data))
      .catch(console.error)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">🐛 Hero Carousel Debug</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Hook Result */}
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-4">Hook Result:</h2>
          <div className="text-sm space-y-2">
            <div>Loading: {loading ? 'true' : 'false'}</div>
            <div>Error: {error || 'none'}</div>
            <div>Slides count: {slides.length}</div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">Slides:</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(slides, null, 2)}
            </pre>
          </div>
        </div>

        {/* Direct API Result */}
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-4">Direct API Result:</h2>
          <div className="text-sm space-y-2">
            <div>Source: {apiTest?.source || 'loading'}</div>
            <div>Total: {apiTest?.total || 0}</div>
            <div>Slides: {apiTest?.slides?.length || 0}</div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">Raw Data:</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(apiTest, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Individual Slide Analysis */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Slide Analysis:</h2>
        <div className="grid gap-4">
          {slides.map((slide, index) => (
            <div key={slide._id} className="bg-gray-50 border rounded p-4">
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Slide {index + 1}:</strong> {slide.title || 'No title'}
                </div>
                <div>
                  Subtitle: {slide.subtitle || 'No subtitle'}
                </div>
                <div>
                  Features: {slide.features?.length || 0}
                </div>
                <div>
                  Image: {slide.image?.asset?.url ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              
              <div className="mt-2 text-xs">
                Background: {slide.backgroundGradient || 'none'} | 
                CTA: {slide.ctaText || 'none'} | 
                Active: {slide.isActive ? 'Yes' : 'No'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}