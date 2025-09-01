import { NextResponse } from 'next/server'
import { withCors } from '../../../lib/cors'
import { client } from '../../../lib/sanity'

// GROQ query for hero slides
const heroSlidesQuery = `
  *[_type == "heroSlide" && isActive == true] | order(order asc) {
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

async function handleGET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const activeOnly = searchParams.get('active') !== 'false'
    
    console.log('Fetching hero slides from Sanity...')
    
    // Fetch from Sanity with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Sanity query timeout')), 5000)
    })
    
    const queryPromise = client.fetch(heroSlidesQuery)
    
    let slides = await Promise.race([queryPromise, timeoutPromise])
    
    // Filter active slides if requested
    if (activeOnly) {
      slides = slides.filter((slide: any) => slide.isActive)
    }
    
    // Apply limit if specified
    if (limit) {
      slides = slides.slice(0, parseInt(limit))
    }
    
    console.log(`Found ${slides.length} hero slides from Sanity`)
    
    return NextResponse.json({
      slides,
      total: slides.length,
      source: 'sanity'
    })
    
  } catch (error) {
    console.error('Error fetching hero slides from Sanity:', error)
    
    // Return fallback slides on error
    const fallbackSlides = [
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
    
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    let slides = fallbackSlides
    
    if (limit) {
      slides = slides.slice(0, parseInt(limit))
    }
    
    return NextResponse.json({
      slides,
      total: slides.length,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handlePOST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      subtitle,
      description,
      features,
      searchPlaceholder,
      ctaText,
      ctaLink,
      backgroundGradient,
      textColor,
      order,
      isActive = true
    } = body

    console.log('Creating new hero slide in Sanity...')

    // Create document in Sanity
    const newSlide = await client.create({
      _type: 'heroSlide',
      title,
      subtitle,
      description,
      features,
      searchPlaceholder,
      ctaText,
      ctaLink,
      backgroundGradient,
      textColor,
      order,
      isActive
    })

    console.log('Hero slide created:', newSlide._id)

    return NextResponse.json({
      success: true,
      slide: newSlide,
      source: 'sanity'
    })

  } catch (error) {
    console.error('Error creating hero slide:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create hero slide'
      },
      { status: 500 }
    )
  }
}

async function handlePUT(request: Request) {
  try {
    const body = await request.json()
    const { _id, ...updates } = body

    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      )
    }

    console.log('Updating hero slide in Sanity:', _id)

    // Update document in Sanity
    const updatedSlide = await client.patch(_id).set(updates).commit()

    console.log('Hero slide updated:', updatedSlide._id)

    return NextResponse.json({
      success: true,
      slide: updatedSlide,
      source: 'sanity'
    })

  } catch (error) {
    console.error('Error updating hero slide:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update hero slide'
      },
      { status: 500 }
    )
  }
}

async function handleDELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const _id = searchParams.get('id')

    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      )
    }

    console.log('Deleting hero slide from Sanity:', _id)

    // Delete document from Sanity
    await client.delete(_id)

    console.log('Hero slide deleted:', _id)

    return NextResponse.json({
      success: true,
      deletedId: _id,
      source: 'sanity'
    })

  } catch (error) {
    console.error('Error deleting hero slide:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete hero slide'
      },
      { status: 500 }
    )
  }
}

// Export wrapped handlers with CORS
export const GET = withCors(handleGET)
export const POST = withCors(handlePOST)
export const PUT = withCors(handlePUT)
export const DELETE = withCors(handleDELETE)

// Handle preflight OPTIONS requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Max-Age': '86400',
    },
  })
}