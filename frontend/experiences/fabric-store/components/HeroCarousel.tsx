'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

const slides = [
  {
    id: 1,
    priceTag: "Starting at $89/yard",
    headline: "Exquisite Upholstery Collections",
    subtext: "Discover premium fabrics crafted by master weavers, where luxury meets enduring sophistication",
    ctaText: "Explore Upholstery",
    ctaLink: "/browse?category=upholstery",
    backgroundImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&h=800&fit=crop",
    backgroundAlt: "Elegant living room with upholstered sofa",
    accent: "burgundy"
  },
  {
    id: 2,
    priceTag: "From $54/yard",
    headline: "Couture Window Treatments",
    subtext: "Transform your windows with handcrafted drapery fabrics that frame natural light beautifully",
    ctaText: "View Collections",
    ctaLink: "/browse?category=curtains",
    backgroundImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=800&fit=crop",
    backgroundAlt: "Beautiful curtains in a bright room",
    accent: "forest"
  },
  {
    id: 3,
    priceTag: "Starting at $39/yard",
    headline: "Artisanal Home Textiles",
    subtext: "Curated fabrics that tell stories of craftsmanship, bringing warmth and character to every space",
    ctaText: "Discover More",
    ctaLink: "/browse",
    backgroundImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=800&fit=crop",
    backgroundAlt: "Cozy living space with fabric cushions",
    accent: "champagne"
  },
  {
    id: 4,
    priceTag: "From $79/yard",
    headline: "Sustainable Luxury Fabrics",
    subtext: "Ethically sourced materials that honor both environmental responsibility and timeless elegance",
    ctaText: "Shop Conscious",
    ctaLink: "/browse?category=eco-friendly",
    backgroundImage: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1920&h=800&fit=crop",
    backgroundAlt: "Natural fabric textures and materials",
    accent: "forest"
  }
]

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const getAccentColors = (accent: string) => {
    switch (accent) {
      case 'burgundy':
        return {
          primaryBg: 'bg-burgundy-600',
          hoverBg: 'hover:bg-burgundy-700',
          borderColor: 'border-burgundy-600/30',
          textColor: 'text-burgundy-100'
        }
      case 'forest':
        return {
          primaryBg: 'bg-forest-500',
          hoverBg: 'hover:bg-forest-600',
          borderColor: 'border-forest-500/30',
          textColor: 'text-forest-100'
        }
      default:
        return {
          primaryBg: 'bg-charcoal-800',
          hoverBg: 'hover:bg-charcoal-700',
          borderColor: 'border-charcoal-800/30',
          textColor: 'text-charcoal-100'
        }
    }
  }

  return (
    <div className="relative w-full h-[600px] md:h-[700px] lg:h-[750px] overflow-hidden">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => {
          const accentColors = getAccentColors(slide.accent)
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ${
                index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {/* Enhanced Background Image with Luxury Overlay */}
              <div className="absolute inset-0">
                <img
                  src={slide.backgroundImage}
                  alt={slide.backgroundAlt}
                  className="w-full h-full object-cover scale-105 transition-transform duration-[8000ms]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-charcoal-900/80 via-charcoal-900/60 to-charcoal-900/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 via-transparent to-transparent" />
              </div>

              {/* Enhanced Content */}
              <div className="relative h-full flex items-center">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
                  <div className="max-w-3xl">
                    {/* Luxury Price Badge */}
                    <div className="inline-flex items-center mb-6 animate-fade-in-up">
                      <div className="relative">
                        <span className={`${accentColors.primaryBg} backdrop-blur-md text-pearl-50 px-6 py-3 
                                        rounded-full text-sm font-medium tracking-wide shadow-luxury
                                        border ${accentColors.borderColor}`}>
                          <Sparkles className="inline w-4 h-4 mr-2" />
                          {slide.priceTag}
                        </span>
                      </div>
                    </div>
                    
                    {/* Enhanced Headlines with Luxury Typography */}
                    <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold text-pearl-50 
                                   mb-6 leading-tight tracking-tight animate-fade-in-up animation-delay-200
                                   text-shimmer">
                      {slide.headline}
                    </h1>
                    
                    <p className="font-sans text-xl md:text-2xl text-pearl-100/90 mb-10 leading-relaxed 
                                 animate-fade-in-up animation-delay-400 max-w-2xl">
                      {slide.subtext}
                    </p>
                    
                    {/* Enhanced CTA Button */}
                    <div className="animate-fade-in-up animation-delay-600">
                      <Link
                        href={slide.ctaLink}
                        className={`inline-flex items-center px-10 py-5 ${accentColors.primaryBg} ${accentColors.hoverBg}
                                   text-pearl-50 font-medium rounded-xl shadow-luxury hover:shadow-luxury-lg 
                                   transform transition-all duration-500 hover:scale-105 hover:-translate-y-1
                                   border border-pearl-50/20 backdrop-blur-sm group`}
                      >
                        <span className="mr-3">{slide.ctaText}</span>
                        <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Enhanced Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-4 bg-pearl-50/10 backdrop-blur-md 
                   rounded-xl text-pearl-50 hover:bg-pearl-50/20 transition-all duration-300 
                   shadow-luxury hover:shadow-luxury-lg transform hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-4 bg-pearl-50/10 backdrop-blur-md 
                   rounded-xl text-pearl-50 hover:bg-pearl-50/20 transition-all duration-300 
                   shadow-luxury hover:shadow-luxury-lg transform hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-7 h-7" />
      </button>

      {/* Enhanced Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-500 backdrop-blur-sm ${
              index === currentSlide 
                ? 'bg-pearl-50 w-12 shadow-luxury' 
                : 'bg-pearl-50/40 w-2 hover:bg-pearl-50/60 hover:w-8'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}