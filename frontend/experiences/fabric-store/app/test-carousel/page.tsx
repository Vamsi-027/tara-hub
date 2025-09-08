'use client'

import { useState, useEffect } from 'react'
import { getHeroSlides } from '../../lib/sanity'

export default function TestCarousel() {
  const [slides, setSlides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function test() {
      console.log('Testing hero slides...')
      try {
        const data = await getHeroSlides()
        console.log('Success! Got slides:', data.length)
        setSlides(data)
      } catch (err) {
        console.error('Error:', err)
        setError((err as Error).message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    test()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Hero Carousel Test Page</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <p>Found {slides.length} slides</p>
      
      {slides.map((slide, index) => (
        <div key={slide._id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h2>Slide {index + 1}: {slide.title}</h2>
          <p><strong>Subtitle:</strong> {slide.subtitle}</p>
          <p><strong>Description:</strong> {slide.description}</p>
          <p><strong>Features:</strong> {slide.features.length} features</p>
          <p><strong>Background:</strong> {slide.backgroundGradient}</p>
          <p><strong>CTA:</strong> {slide.ctaText} → {slide.ctaLink}</p>
          <p><strong>Search placeholder:</strong> {slide.searchPlaceholder}</p>
        </div>
      ))}
    </div>
  )
}