"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Share2, Heart, ShoppingCart, ExternalLink } from 'lucide-react'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { config } from "@/lib/config"
import type { Fabric } from "@/lib/types"

interface FabricDetailPageProps {
  fabric: Fabric
}

export function FabricDetailPage({ fabric }: FabricDetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/fabrics" className="hover:text-gray-900 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Fabrics
          </Link>
          <span>/</span>
          <span className="text-gray-900">{fabric.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-white">
              <Image
                src={fabric.detailImages[selectedImage] || fabric.swatchImageUrl}
                alt={fabric.name}
                width={600}
                height={600}
                className="w-full h-full object-cover transition-opacity duration-200"
                onLoad={(e) => {
                  (e.target as HTMLImageElement).style.opacity = '1'
                }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  if (!img.src.includes('placeholder-image.png')) {
                    console.warn(`Failed to load fabric image: ${img.src}`)
                    img.src = '/placeholder-image.png'
                  }
                }}
                style={{ opacity: '0' }}
              />
            </div>
            
            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-2">
              {fabric.detailImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-md border-2 ${
                    selectedImage === index ? 'border-gray-900' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image || "/placeholder-image.png"}
                    alt={`${fabric.name} view ${index + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover transition-opacity duration-200"
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.opacity = '1'
                    }}
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      if (!img.src.includes('placeholder-image.png')) {
                        img.src = '/placeholder-image.png'
                      }
                    }}
                    style={{ opacity: '0' }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{fabric.name}</h1>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant={fabric.inStock ? "default" : "secondary"}>
                  {fabric.inStock ? "In Stock" : "Made to Order"}
                </Badge>
                <Badge variant="outline">{fabric.category}</Badge>
                <Badge variant="outline">{fabric.color}</Badge>
              </div>

              <p className="text-lg text-gray-600 mb-6">{fabric.description}</p>
            </div>

            {/* Quick Specs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Composition:</span>
                    <p className="font-medium">{fabric.composition}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Width:</span>
                    <p className="font-medium">{fabric.width}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Weight:</span>
                    <p className="font-medium">{fabric.weight}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Origin:</span>
                    <p className="font-medium">{fabric.origin}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Price per yard</span>
                    <p className="text-3xl font-bold text-gray-900">${fabric.pricePerYard}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Minimum Order</span>
                    <p className="text-lg font-medium">{fabric.minimumOrder} yards</p>
                  </div>
                </div>
                {fabric.leadTime && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Lead Time:</span> {fabric.leadTime}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link href={config.etsyFabricListingUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button className="w-full flex items-center justify-center bg-amber-600 hover:bg-amber-700" size="lg">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy on Etsy
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button variant="outline" className="w-full flex items-center" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download Spec Sheet
              </Button>
            </div>

            {/* Designer Info */}
            {fabric.designer && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm">
                    <span className="text-gray-500">Designer:</span>
                    <p className="font-medium">{fabric.designer}</p>
                    {fabric.collection && (
                      <>
                        <span className="text-gray-500">Collection:</span>
                        <p className="font-medium">{fabric.collection}</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="specifications" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="care">Care Instructions</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="specifications" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Physical Properties</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Composition:</span>
                            <span>{fabric.composition}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Width:</span>
                            <span>{fabric.width}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Weight:</span>
                            <span>{fabric.weight}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Durability:</span>
                            <span>{fabric.durability}</span>
                          </div>
                          {fabric.patternRepeat && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pattern Repeat:</span>
                              <span>{fabric.patternRepeat}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Origin & Design</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Origin:</span>
                            <span>{fabric.origin}</span>
                          </div>
                          {fabric.designer && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Designer:</span>
                              <span>{fabric.designer}</span>
                            </div>
                          )}
                          {fabric.collection && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Collection:</span>
                              <span>{fabric.collection}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="applications" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Recommended Applications</h4>
                      <ul className="space-y-2">
                        {fabric.applications.map((application, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                            {application}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                      <ul className="space-y-2">
                        {fabric.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="care" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Care Instructions</h4>
                      <p className="text-sm text-gray-600 mb-4">{fabric.careInstructions}</p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">General Care Tips</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Vacuum regularly with upholstery attachment</li>
                        <li>• Rotate cushions periodically for even wear</li>
                        <li>• Keep away from direct sunlight to prevent fading</li>
                        <li>• Address spills immediately with clean, dry cloth</li>
                        <li>• Professional cleaning recommended for best results</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Performance Ratings</h4>
                      <div className="space-y-3">
                        {fabric.abrasionRating && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Abrasion Resistance:</span>
                              <span className="font-medium">{fabric.abrasionRating}</span>
                            </div>
                          </div>
                        )}
                        
                        {fabric.lightFastness && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Light Fastness:</span>
                              <span className="font-medium">{fabric.lightFastness}</span>
                            </div>
                          </div>
                        )}
                        
                        {fabric.pillResistance && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Pill Resistance:</span>
                              <span className="font-medium">{fabric.pillResistance}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Safety Standards</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Flammability:</span>
                          <span className="font-medium">{fabric.flammabilityRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  )
}
