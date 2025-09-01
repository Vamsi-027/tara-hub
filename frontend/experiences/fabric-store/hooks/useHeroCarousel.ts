import { useState, useEffect } from 'react'
import { getHeroSlides, HeroSlide } from '../lib/sanity'

export function useHeroCarousel() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSlides() {
      try {
        setLoading(true)
        setError(null)
        console.log('Fetching hero slides...')
        const data = await getHeroSlides()
        console.log('Hero slides fetched:', data.length, 'slides')
        console.log('First slide:', data[0])
        setSlides(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch hero slides')
        console.error('Error in useHeroCarousel:', err)
      } finally {
        setLoading(false)
        console.log('Hero carousel loading finished')
      }
    }

    fetchSlides()
  }, [])

  return {
    slides,
    loading,
    error,
    refetch: () => {
      setLoading(true)
      getHeroSlides().then(setSlides).finally(() => setLoading(false))
    }
  }
}