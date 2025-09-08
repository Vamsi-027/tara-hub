"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, X, Image as ImageIcon, Plus, 
  AlertCircle, CheckCircle, Loader2 
} from "lucide-react"
import { toast } from "sonner"

interface UploadedImage {
  url: string
  key: string
  filename: string
  size: number
  type: string
}

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  maxFileSize?: number // in MB
  disabled?: boolean
  className?: string
  fabricId?: string // Optional fabric ID for linking images
}

export function ImageUpload({ 
  images = [], 
  onChange, 
  maxImages = 20, 
  maxFileSize = 10,
  disabled = false,
  className = "",
  fabricId
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    // Check if we would exceed max images
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed. You can upload ${maxImages - images.length} more.`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      Array.from(files).forEach(file => {
        formData.append('files', file)
      })

      // Add fabric ID to the URL if provided
      const uploadUrl = fabricId 
        ? `/api/upload/fabric-images?fabricId=${fabricId}`
        : '/api/upload/fabric-images'

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed')
      }

      if (data.data?.uploads && data.data.uploads.length > 0) {
        const newImages = data.data.uploads.map((upload: UploadedImage) => upload.url)
        onChange([...images, ...newImages])
        
        toast.success(`Successfully uploaded ${data.data.uploads.length} image${data.data.uploads.length > 1 ? 's' : ''}`)
      }

      if (data.data?.errors && data.data.errors.length > 0) {
        data.data.errors.forEach((error: string) => {
          toast.error(error)
        })
      }

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [images, onChange, maxImages])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (disabled || uploading) return
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect, disabled, uploading])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !uploading) {
      setDragActive(true)
    }
  }, [disabled, uploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Reset input so same file can be selected again
    e.target.value = ''
  }, [handleFileSelect])

  const removeImage = useCallback((index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    onChange(newImages)
  }, [images, onChange])

  const reorderImage = useCallback((fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [removed] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, removed)
    onChange(newImages)
  }, [images, onChange])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : disabled 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <div>
              <p className="text-lg font-medium">Uploading images...</p>
              <Progress value={uploadProgress} className="w-64 mx-auto mt-2" />
            </div>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop images here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="text-blue-500 hover:text-blue-600 underline disabled:text-gray-400"
              >
                browse
              </button>
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Supports JPEG, PNG, WebP • Max {maxFileSize}MB each • Up to {maxImages} images
            </p>
            <p className="text-xs text-muted-foreground">
              {images.length} / {maxImages} images uploaded
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleFileInputChange}
          disabled={disabled || uploading}
          className="hidden"
        />
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Uploaded Images ({images.length})</h4>
            {images.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                First image will be the primary showcase
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <Card key={index} className="group relative overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={image}
                      alt={`Fabric image ${index + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-200"
                      loading="lazy"
                      onLoad={(e) => {
                        (e.target as HTMLImageElement).style.opacity = '1'
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        if (!img.src.includes('placeholder-image.png')) {
                          console.warn(`Failed to load image: ${img.src}`)
                          img.src = '/placeholder-image.png'
                          img.style.opacity = '0.5'
                        }
                      }}
                      style={{ opacity: '0' }}
                    />
                    
                    {/* Primary badge */}
                    {index === 0 && (
                      <Badge className="absolute top-2 left-2 bg-blue-500 text-white text-xs">
                        Primary
                      </Badge>
                    )}

                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => removeImage(index)}
                        disabled={disabled}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => reorderImage(index, 0)}
                          disabled={disabled}
                          className="text-xs px-2 h-8"
                        >
                          Make Primary
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Add more button */}
            {images.length < maxImages && !disabled && (
              <Card 
                className="border-dashed border-2 border-gray-300 hover:border-gray-400 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="p-0">
                  <div className="aspect-square flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <Plus className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Add More</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Info Alert */}
      <Alert>
        <ImageIcon className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Image Tips:</strong> Upload high-quality images (min 800x600px). 
          The first image will be used as the primary showcase. You can reorder images by clicking "Make Primary".
          Images are stored securely in Cloudflare R2.
        </AlertDescription>
      </Alert>
    </div>
  )
}