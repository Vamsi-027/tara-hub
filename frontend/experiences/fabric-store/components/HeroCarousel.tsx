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

  const getAccentColors = () => {
    // Always use modern blue accent for consistency
    return {
      primaryBg: 'bg-blue-600',
      hoverBg: 'hover:bg-blue-700',
      borderColor: 'border-blue-600/30',
      textColor: 'text-blue-100'
    }
  }

  return (
    <div className="relative w-full h-[600px] md:h-[700px] lg:h-[750px] overflow-hidden">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => {
          const accentColors = getAccentColors()
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
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
              </div>

              {/* Enhanced Content */}
              <div className="relative h-full flex items-center">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
                  <div className="max-w-3xl">
                    {/* Luxury Price Badge */}
                    <div className="inline-flex items-center mb-6 animate-fade-in-up">
                      <div className="relative">
                        <span className={`${accentColors.primaryBg} backdrop-blur-md text-white px-6 py-3
                                        rounded-full text-sm font-medium tracking-wide shadow-md
                                        border ${accentColors.borderColor}`}>
                          <Sparkles className="inline w-4 h-4 mr-2" />
                          {slide.priceTag}
                        </span>
                      </div>
                    </div>
                    
                    {/* Enhanced Headlines with Luxury Typography */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white
                                   mb-6 leading-tight tracking-tight animate-fade-in-up animation-delay-200">
                      {slide.headline}
                    </h1>
                    
                    <p className="text-lg md:text-xl text-gray-200 mb-8 md:mb-10 leading-relaxed
                                 animate-fade-in-up animation-delay-400 max-w-2xl">
                      {slide.subtext}
                    </p>
                    
                    {/* Enhanced CTA Button */}
                    <div className="animate-fade-in-up animation-delay-600">
                      <Link
                        href={slide.ctaLink}
                        className={`inline-flex items-center px-8 py-4 ${accentColors.primaryBg} ${accentColors.hoverBg}
                                   text-white font-medium rounded-lg shadow-md hover:shadow-lg
                                   transform transition-all duration-200 hover:scale-105
                                   border border-white/20 backdrop-blur-sm group`}
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
        className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 backdrop-blur-md
                   rounded-lg text-white hover:bg-white/20 transition-all duration-200
                   shadow-md hover:shadow-lg transform hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-7 h-7" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 backdrop-blur-md
                   rounded-lg text-white hover:bg-white/20 transition-all duration-200
                   shadow-md hover:shadow-lg transform hover:scale-110"
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
            className={`h-2 rounded-full transition-all duration-300 backdrop-blur-sm ${
              index === currentSlide
                ? 'bg-white w-12 shadow-md'
                : 'bg-white/40 w-2 hover:bg-white/60 hover:w-8'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}