import { createClient } from '@sanity/client'
// @ts-ignore - No type declarations available for @sanity/image-url
import imageUrlBuilder from '@sanity/image-url'

// Sanity client configuration
export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'd1t5dcup',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: true, // Use CDN for faster response times
  apiVersion: '2023-10-01', // Use current date in YYYY-MM-DD format
  token: process.env.SANITY_API_TOKEN, // Only needed for write operations
})

// Image URL builder
const builder = imageUrlBuilder(client)

export function urlForImage(source: any) {
  return builder.image(source)
}

// GROQ queries for hero carousel
export const heroCarouselQuery = `
  *[_type == "heroSlide"] | order(order asc) {
    _id,
    title,
    subtitle,
    description,
    features[] {
      text,
      color
    },
    searchPlaceholder,
    ctaText,
    ctaLink,
    backgroundGradient,
    textColor,
    image {
      asset->{
        _id,
        url
      },
      alt
    },
    isActive,
    order
  }
`

// Types for TypeScript
export interface HeroSlide {
  _id: string
  title: string
  subtitle: string
  description: string
  features: Array<{
    text: string
    color: 'amber' | 'green' | 'blue' | 'purple' | 'red'
  }>
  searchPlaceholder: string
  ctaText: string
  ctaLink: string
  backgroundGradient: 'blue' | 'purple' | 'green' | 'orange'
  textColor: 'white' | 'black'
  image: {
    asset: {
      _id: string
      url: string
    }
    alt: string
  }
  isActive: boolean
  order: number
}

// Fetch hero carousel slides with timeout
export async function getHeroSlides(): Promise<HeroSlide[]> {
  console.log('Fetching hero slides from Sanity with API token...')
  
  try {
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Sanity query timeout')), 3000)
    })
    
    const queryPromise = client.fetch(heroCarouselQuery)
    
    const slides = await Promise.race([queryPromise, timeoutPromise])
    
    if (slides && Array.isArray(slides) && slides.length > 0) {
      console.log(`Found ${slides.length} slides from Sanity`)
      return slides.filter((slide: HeroSlide) => slide.isActive)
    } else {
      console.log('No slides found in Sanity, using fallback data')
      return getFallbackSlides()
    }
  } catch (error) {
    console.error('Error fetching hero slides from Sanity:', error)
    console.log('Using fallback slides')
    return getFallbackSlides()
  }
}

// Fallback slides if Sanity is not available
function getFallbackSlides(): HeroSlide[] {
  return [
    {
      _id: 'fallback-1',
      title: 'Experience Luxury Fabrics First-Hand',
      subtitle: 'Touch the Difference Quality Makes',
      description: 'Discover our curated collection of premium fabric samples from world-renowned mills. Each professionally mounted sample includes complete specifications.',
      features: [
        { text: '500+ Interior Designers', color: 'amber' },
        { text: 'Free Shipping', color: 'green' },
        { text: '3-5 Day Delivery', color: 'blue' },
        { text: 'Premium Quality', color: 'purple' }
      ],
      searchPlaceholder: 'Search fabrics by designer, style, color...',
      ctaText: 'Explore Collections',
      ctaLink: '/browse',
      backgroundGradient: 'blue',
      textColor: 'black',
      image: {
        asset: {
          _id: 'fallback-image-1',
          url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'
        },
        alt: 'Luxury fabric samples'
      },
      isActive: true,
      order: 1
    },
    {
      _id: 'fallback-2',
      title: 'Designer Collections Now Available',
      subtitle: 'Exclusive Access to Trade-Only Fabrics',
      description: 'Get access to premium designer collections from heritage mills. Perfect for interior designers and luxury projects.',
      features: [
        { text: 'Exclusive Access', color: 'purple' },
        { text: 'Trade-Only Collections', color: 'blue' },
        { text: 'Heritage Mills', color: 'amber' },
        { text: 'Designer Approved', color: 'green' }
      ],
      searchPlaceholder: 'Search designer collections...',
      ctaText: 'Browse Designer Lines',
      ctaLink: '/browse?featured=true',
      backgroundGradient: 'purple',
      textColor: 'black',
      image: {
        asset: {
          _id: 'fallback-image-2',
          url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
        },
        alt: 'Designer fabric collection'
      },
      isActive: true,
      order: 2
    },
    {
      _id: 'fallback-3',
      title: 'Free Fabric Swatches',
      subtitle: 'See & Feel Before You Buy',
      description: 'Order up to 5 fabric swatches completely free. Professional presentation with full specifications included.',
      features: [
        { text: 'Completely Free', color: 'green' },
        { text: 'Up to 5 Swatches', color: 'blue' },
        { text: 'Professional Mount', color: 'amber' },
        { text: 'Full Specifications', color: 'purple' }
      ],
      searchPlaceholder: 'Find your perfect fabric...',
      ctaText: 'Order Free Swatches',
      ctaLink: '/browse',
      backgroundGradient: 'green',
      textColor: 'black',
      image: {
        asset: {
          _id: 'fallback-image-3',
          url: 'https://images.unsplash.com/photo-1559836648-d7a13acefcc9?w=800&h=600&fit=crop'
        },
        alt: 'Free fabric swatches'
      },
      isActive: true,
      order: 3
    }
  ]
}