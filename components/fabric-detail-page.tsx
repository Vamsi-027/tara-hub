"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Check, X, Mail, Phone } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import type { Fabric } from "@/lib/fabric-seed-data"

interface FabricDetailPageProps {
  fabric: Fabric
}

export function FabricDetailPage({ fabric }: FabricDetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  
  const images = fabric.images?.filter(Boolean) || [fabric.swatchImageUrl || "/placeholder.jpg"]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/fabrics">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Fabrics
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
              <Image
                src={images[selectedImage] || "/placeholder.svg"}
                alt={fabric.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-amber-500' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${fabric.name} view ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{fabric.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{fabric.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">{fabric.category}</Badge>
                <Badge variant="secondary">{fabric.color}</Badge>
                <Badge variant="secondary">{fabric.pattern}</Badge>
                {fabric.inStock ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <Check className="w-3 h-3 mr-1" />
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <X className="w-3 h-3 mr-1" />
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full" size="lg">
                <Mail className="w-4 h-4 mr-2" />
                Request Information
              </Button>
              <Button variant="outline" className="w-full" size="lg">
                Request Sample
              </Button>
              <Button variant="ghost" className="w-full" size="lg">
                <Phone className="w-4 h-4 mr-2" />
                Schedule Consultation
              </Button>
            </div>

            {/* Quick Specs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Composition:</span>
                  <span className="font-medium">{fabric.composition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Width:</span>
                  <span className="font-medium">{fabric.width}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{fabric.weight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Origin:</span>
                  <span className="font-medium">{fabric.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lead Time:</span>
                  <span className="font-medium">{fabric.leadTime}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="specifications" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="care">Care Instructions</TabsTrigger>
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
                            <span className="text-gray-600">Texture:</span>
                            <span>{fabric.texture}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Design Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Color:</span>
                            <span>{fabric.color}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Pattern:</span>
                            <span>{fabric.pattern}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Origin:</span>
                            <span>{fabric.origin}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Category:</span>
                            <span>{fabric.category}</span>
                          </div>
                        </div>
                      </div>
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
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Durability</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Durability Rating:</span>
                            <span>{fabric.durability}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Light Fastness:</span>
                            <span>{fabric.lightFastness}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Abrasion Resistance:</span>
                            <span>{fabric.abrasionResistance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Special Properties</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Flame Retardant:</span>
                            <span>{fabric.flameRetardant ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Antimicrobial:</span>
                            <span>{fabric.antimicrobial ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Stain Resistant:</span>
                            <span>{fabric.stainResistant ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Water Repellent:</span>
                            <span>{fabric.waterRepellent ? 'Yes' : 'No'}</span>
                          </div>
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
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Recommended Applications</h4>
                      <div className="flex flex-wrap gap-2">
                        {fabric.applications.map((application, index) => (
                          <Badge key={index} variant="outline">{application}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Ordering Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Minimum Order:</span>
                          <span>{fabric.minimumOrder}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Lead Time:</span>
                          <span>{fabric.leadTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stock Status:</span>
                          <span className={fabric.inStock ? 'text-green-600' : 'text-red-600'}>
                            {fabric.inStock ? 'In Stock' : 'Made to Order'}
                          </span>
                        </div>
                      </div>
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
                      <p className="text-gray-700">{fabric.care}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Professional Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Always test cleaning methods on an inconspicuous area first</li>
                        <li>Avoid direct sunlight to prevent fading</li>
                        <li>Rotate cushions regularly for even wear</li>
                        <li>Professional cleaning recommended for best results</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
