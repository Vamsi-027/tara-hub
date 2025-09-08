'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  {
    id: 1,
    priceTag: "Starting at $89/yard",
    headline: "Premium Upholstery Fabrics",
    subtext: "Transform your furniture with luxurious, durable fabrics that blend comfort with sophisticated design",
    ctaText: "Shop Upholstery",
    ctaLink: "/browse?category=upholstery",
    backgroundImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&h=800&fit=crop",
    backgroundAlt: "Elegant living room with upholstered sofa"
  },
  {
    id: 2,
    priceTag: "From $54/yard",
    headline: "Elegant Curtains & Drapes",
    subtext: "Discover exquisite window treatments that elevate your space with natural light and privacy",
    ctaText: "Browse Collections",
    ctaLink: "/browse?category=curtains",
    backgroundImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=800&fit=crop",
    backgroundAlt: "Beautiful curtains in a bright room"
  },
  {
    id: 3,
    priceTag: "Starting at $39/yard",
    headline: "Luxury Fabrics for Every Living Space",
    subtext: "From cozy cushions to statement pieces, find the perfect fabric to express your unique style",
    ctaText: "Transform Your Home",
    ctaLink: "/browse",
    backgroundImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=800&fit=crop",
    backgroundAlt: "Cozy living space with fabric cushions"
  },
  {
    id: 4,
    priceTag: "From $79/yard",
    headline: "Eco-Friendly & Sustainable Choices",
    subtext: "Beautiful, responsibly sourced fabrics that care for your home and our planet",
    ctaText: "Shop Sustainable",
    ctaLink: "/browse?category=eco-friendly",
    backgroundImage: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1920&h=800&fit=crop",
    backgroundAlt: "Natural fabric textures and materials"
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

  return (
    <div className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <img
                src={slide.backgroundImage}
                alt={slide.backgroundAlt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center mb-4 animate-fade-in-up">
                    <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/30">
                      {slide.priceTag}
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in-up animation-delay-100">
                    {slide.headline}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-100 mb-8 animate-fade-in-up animation-delay-200">
                    {slide.subtext}
                  </p>
                  <Link
                    href={slide.ctaLink}
                    className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transform transition-all duration-300 hover:scale-105 animate-fade-in-up animation-delay-300"
                  >
                    {slide.ctaText}
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animation-delay-100 {
          animation-delay: 100ms;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  )
}