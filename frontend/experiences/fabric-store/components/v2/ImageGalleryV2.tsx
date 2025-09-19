'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Maximize2, Grid3X3, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageGalleryV2Props {
  images: string[]
  productName: string
  className?: string
}

interface ImageType {
  url: string
  type: 'swatch' | 'lifestyle' | 'detail' | 'technical'
  alt: string
}

// Enhanced image data structure to handle different image types
const createImageData = (images: string[], productName: string): ImageType[] => {
  return images.map((url, index) => {
    // Determine image type based on index or URL patterns
    let type: ImageType['type'] = 'swatch'
    if (index === 0) type = 'swatch'
    else if (index % 3 === 1) type = 'lifestyle'
    else if (index % 3 === 2) type = 'detail'
    else type = 'technical'

    return {
      url,
      type,
      alt: `${productName} - ${type} view ${index + 1}`
    }
  })
}

// Mock images for demo - in production these would come from props
const generateMockImages = (productName: string): ImageType[] => [
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    type: 'swatch',
    alt: `${productName} - Fabric swatch close-up`
  },
  {
    url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800',
    type: 'lifestyle',
    alt: `${productName} - Styled in living room setting`
  },
  {
    url: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=800',
    type: 'detail',
    alt: `${productName} - Texture and weave detail`
  },
  {
    url: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=800',
    type: 'technical',
    alt: `${productName} - Technical specification view`
  },
  {
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    type: 'lifestyle',
    alt: `${productName} - Alternative room setting`
  },
  {
    url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    type: 'detail',
    alt: `${productName} - Pattern detail view`
  }
]

export function ImageGalleryV2({ images, productName, className = '' }: ImageGalleryV2Props) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxZoom, setLightboxZoom] = useState(1)
  const [lightboxPosition, setLightboxPosition] = useState({ x: 0, y: 0 })
  const [isZoomed, setIsZoomed] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'swatch' | 'lifestyle' | 'detail'>('all')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const lightboxRef = useRef<HTMLDivElement>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  // Use mock images if none provided
  const imageData = images.length > 0
    ? createImageData(images, productName)
    : generateMockImages(productName)

  // Filter images based on view mode
  const filteredImages = viewMode === 'all'
    ? imageData
    : imageData.filter(img => img.type === viewMode)

  const currentImage = filteredImages[selectedImage] || imageData[0]

  // Image type indicators
  const getTypeIcon = (type: ImageType['type']) => {
    switch (type) {
      case 'swatch': return '🎨'
      case 'lifestyle': return '🏠'
      case 'detail': return '🔍'
      case 'technical': return '📏'
      default: return '📷'
    }
  }

  const getTypeLabel = (type: ImageType['type']) => {
    switch (type) {
      case 'swatch': return 'Fabric Swatch'
      case 'lifestyle': return 'Room Setting'
      case 'detail': return 'Detail View'
      case 'technical': return 'Technical'
      default: return 'Photo'
    }
  }

  // Navigation functions
  const goToNext = () => {
    setSelectedImage((prev) => (prev + 1) % filteredImages.length)
  }

  const goToPrev = () => {
    setSelectedImage((prev) => (prev - 1 + filteredImages.length) % filteredImages.length)
  }

  // Lightbox functions
  const openLightbox = () => {
    setIsLightboxOpen(true)
    setLightboxZoom(1)
    setLightboxPosition({ x: 0, y: 0 })
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setIsLightboxOpen(false)
    setLightboxZoom(1)
    setLightboxPosition({ x: 0, y: 0 })
    setIsZoomed(false)
    document.body.style.overflow = 'unset'
  }

  // Zoom functions
  const zoomIn = () => {
    setLightboxZoom(prev => Math.min(prev * 1.5, 4))
    setIsZoomed(true)
  }

  const zoomOut = () => {
    const newZoom = Math.max(lightboxZoom / 1.5, 1)
    setLightboxZoom(newZoom)
    if (newZoom === 1) {
      setLightboxPosition({ x: 0, y: 0 })
      setIsZoomed(false)
    }
  }

  // Mouse drag for zoomed image
  const handleMouseDown = (e: React.MouseEvent) => {
    if (lightboxZoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - lightboxPosition.x, y: e.clientY - lightboxPosition.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && lightboxZoom > 1) {
      setLightboxPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        switch (e.key) {
          case 'Escape':
            closeLightbox()
            break
          case 'ArrowLeft':
            goToPrev()
            break
          case 'ArrowRight':
            goToNext()
            break
          case '+':
          case '=':
            zoomIn()
            break
          case '-':
            zoomOut()
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, lightboxZoom])

  // Auto-scroll thumbnails to show selected
  useEffect(() => {
    if (thumbnailsRef.current) {
      const selectedThumbnail = thumbnailsRef.current.children[selectedImage] as HTMLElement
      if (selectedThumbnail) {
        selectedThumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }, [selectedImage])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* View Mode Filters */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700">View:</span>
        <div className="flex gap-1">
          {(['all', 'swatch', 'lifestyle', 'detail'] as const).map((mode) => (
            <Button
              key={mode}
              variant={viewMode === mode ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setViewMode(mode)
                setSelectedImage(0)
              }}
              className="text-xs capitalize"
            >
              {mode === 'all' ? '📷 All' : `${getTypeIcon(mode)} ${getTypeLabel(mode)}`}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Image Display */}
      <div className="relative group bg-gray-100 rounded-xl overflow-hidden">
        <div className="aspect-square relative">
          <Image
            src={currentImage.url}
            alt={currentImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />

          {/* Image Type Badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
              <span>{getTypeIcon(currentImage.type)}</span>
              {getTypeLabel(currentImage.type)}
            </span>
          </div>

          {/* Navigation Arrows */}
          {filteredImages.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Zoom Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={openLightbox}
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedImage + 1} / {filteredImages.length}
          </div>
        </div>
      </div>

      {/* Thumbnail Grid */}
      <div
        ref={thumbnailsRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
      >
        {filteredImages.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`
              relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
              ${selectedImage === index
                ? 'border-blue-500 ring-2 ring-blue-500/20'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="80px"
              className="object-cover"
            />

            {/* Type indicator */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
              {getTypeIcon(image.type)}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          {/* Close Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Zoom Controls */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={lightboxZoom <= 1}
              className="bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={lightboxZoom >= 4}
              className="bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-md text-sm">
              {Math.round(lightboxZoom * 100)}%
            </span>
          </div>

          {/* Navigation */}
          {filteredImages.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {/* Main Lightbox Image */}
          <div
            ref={lightboxRef}
            className="relative max-w-[90vw] max-h-[90vh] overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Image
              src={currentImage.url}
              alt={currentImage.alt}
              width={800}
              height={800}
              className="max-w-none transition-transform duration-200"
              style={{
                transform: `scale(${lightboxZoom}) translate(${lightboxPosition.x / lightboxZoom}px, ${lightboxPosition.y / lightboxZoom}px)`,
                cursor: isZoomed ? 'grab' : 'zoom-in'
              }}
              onClick={lightboxZoom === 1 ? zoomIn : undefined}
            />
          </div>

          {/* Image Info */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-center">
            <p className="text-sm font-medium">{currentImage.alt}</p>
            <p className="text-xs opacity-80">
              {selectedImage + 1} of {filteredImages.length} • Press ESC to close
            </p>
          </div>
        </div>
      )}
    </div>
  )
}