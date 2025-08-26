import Image from 'next/image'
import Link from 'next/link'
import { Fabric } from '@/lib/api-client'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

interface FabricDetailPageProps {
  fabric: Fabric
}

export function FabricDetailPage({ fabric }: FabricDetailPageProps) {
  const formatPrice = (price: number | string | undefined) => {
    if (!price) return null
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return `$${numPrice.toFixed(2)}`
  }

  const getDurabilityStars = () => {
    if (!fabric.durabilityRating) return null
    const ratings: Record<string, number> = {
      'Light Duty': 1,
      'Medium Duty': 2,
      'Heavy Duty': 3,
      'Extra Heavy Duty': 4
    }
    return ratings[fabric.durabilityRating as string] || 0
  }

  const getStockStatus = () => {
    if (!fabric.stockQuantity) return { status: 'Unknown', color: 'gray' }
    if (fabric.stockQuantity > 50) return { status: 'In Stock', color: 'green' }
    if (fabric.stockQuantity > 0) return { status: `Only ${fabric.stockQuantity} left`, color: 'yellow' }
    return { status: 'Out of Stock', color: 'red' }
  }

  const stockStatus = getStockStatus()
  const durabilityStars = getDurabilityStars()
  const mainImage = fabric.imageUrl || fabric.mainImageUrl || fabric.thumbnailUrl || fabric.images?.[0]?.url || '/placeholder.jpg'

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/fabrics" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <span>←</span> Back to Fabrics
          </Link>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Gallery */}
            <div className="relative">
              <div className="aspect-square lg:h-[600px] bg-gray-100 relative">
                <Image
                  src={mainImage}
                  alt={fabric.name}
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Status Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {fabric.status === 'Active' && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Available
                    </span>
                  )}
                  {fabric.isFeatured && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      Featured
                    </span>
                  )}
                  {fabric.isNewArrival && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      New Arrival
                    </span>
                  )}
                  {fabric.isBestSeller && (
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      Best Seller
                    </span>
                  )}
                </div>
              </div>

              {/* Image Gallery Thumbnails */}
              {fabric.images && fabric.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {fabric.images.map((img: any, index: number) => (
                    <div key={index} className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={img.url}
                        alt={img.alt || `${fabric.name} view ${index + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-8 space-y-6">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{fabric.name}</h1>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-lg text-gray-600 mb-4">
                  {fabric.manufacturerName && <span>by {fabric.manufacturerName}</span>}
                  {fabric.sku && (
                    <span className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {fabric.sku}
                    </span>
                  )}
                </div>

                {/* Pricing */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {fabric.retailPrice && (
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(fabric.retailPrice)}
                      <span className="text-sm text-gray-500 font-normal ml-2">
                        {fabric.priceUnit || 'per yard'}
                      </span>
                    </div>
                  )}
                  {fabric.wholesalePrice && (
                    <div className="text-lg text-gray-600">
                      Trade: {formatPrice(fabric.wholesalePrice)}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {fabric.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-3 text-gray-900">Description</h2>
                  <p className="text-gray-700 leading-relaxed">{fabric.description}</p>
                </div>
              )}

              {/* Quick Specs */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
                {fabric.type && (
                  <div>
                    <span className="text-sm text-gray-500 block">Type</span>
                    <p className="font-medium text-gray-900">{fabric.type}</p>
                  </div>
                )}
                {fabric.width && (
                  <div>
                    <span className="text-sm text-gray-500 block">Width</span>
                    <p className="font-medium text-gray-900">
                      {fabric.width} {fabric.widthUnit || 'inches'}
                    </p>
                  </div>
                )}
                {fabric.weight && (
                  <div>
                    <span className="text-sm text-gray-500 block">Weight</span>
                    <p className="font-medium text-gray-900">
                      {fabric.weight} {fabric.weightUnit || 'oz/yd'}
                    </p>
                  </div>
                )}
                {fabric.pattern && (
                  <div>
                    <span className="text-sm text-gray-500 block">Pattern</span>
                    <p className="font-medium text-gray-900">{fabric.pattern}</p>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              {fabric.stockQuantity !== undefined && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Availability</h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${stockStatus.color}-500`}></div>
                    <span className="text-gray-700">{stockStatus.status}</span>
                    {fabric.leadTimeDays && (
                      <span className="text-sm text-gray-500">
                        Lead time: {fabric.leadTimeDays} days
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Specifications */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Detailed Specifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Material & Composition */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Material & Composition
              </h3>
              
              {fabric.fiberContent && fabric.fiberContent.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500 block">Fiber Content</span>
                  <div className="space-y-1">
                    {fabric.fiberContent.map((fiber: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-sm">{fiber.fiber}</span>
                        <span className="text-sm font-medium">{fiber.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fabric.backingType && (
                <div>
                  <span className="text-sm text-gray-500 block">Backing</span>
                  <p className="font-medium">{fabric.backingType}</p>
                </div>
              )}

              {fabric.finishTreatment && (
                <div>
                  <span className="text-sm text-gray-500 block">Finish Treatment</span>
                  <p className="font-medium">{fabric.finishTreatment}</p>
                </div>
              )}

              {fabric.thickness && (
                <div>
                  <span className="text-sm text-gray-500 block">Thickness</span>
                  <p className="font-medium">{fabric.thickness} mm</p>
                </div>
              )}
            </div>

            {/* Performance Ratings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Performance Ratings
              </h3>
              
              {durabilityStars && (
                <div>
                  <span className="text-sm text-gray-500 block">Durability Rating</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(4)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < durabilityStars ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">{fabric.durabilityRating}</span>
                  </div>
                </div>
              )}

              {fabric.martindale && (
                <div>
                  <span className="text-sm text-gray-500 block">Martindale Test</span>
                  <p className="font-medium">{fabric.martindale.toLocaleString()} cycles</p>
                </div>
              )}

              {fabric.lightfastness && (
                <div>
                  <span className="text-sm text-gray-500 block">Lightfastness</span>
                  <p className="font-medium">{fabric.lightfastness}/8</p>
                </div>
              )}

              {fabric.pillingResistance && (
                <div>
                  <span className="text-sm text-gray-500 block">Pilling Resistance</span>
                  <p className="font-medium">{fabric.pillingResistance}/5</p>
                </div>
              )}
            </div>

            {/* Treatment Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Treatment Features
              </h3>
              
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: 'isStainResistant', label: 'Stain Resistant', color: 'blue' },
                  { key: 'isFadeResistant', label: 'Fade Resistant', color: 'yellow' },
                  { key: 'isWaterResistant', label: 'Water Resistant', color: 'cyan' },
                  { key: 'isPetFriendly', label: 'Pet Friendly', color: 'green' },
                  { key: 'isOutdoorSafe', label: 'Outdoor Safe', color: 'orange' },
                  { key: 'isFireRetardant', label: 'Fire Retardant', color: 'red' },
                  { key: 'isBleachCleanable', label: 'Bleach Cleanable', color: 'indigo' },
                  { key: 'isAntimicrobial', label: 'Antimicrobial', color: 'purple' },
                ].map(({ key, label, color }) => {
                  const hasFeature = fabric[key as keyof Fabric] as boolean
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          hasFeature ? `bg-${color}-500` : 'bg-gray-300'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          hasFeature ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Design & Style Information */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Design & Style</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fabric.collection && (
              <div>
                <span className="text-sm text-gray-500 block">Collection</span>
                <p className="font-medium text-lg">{fabric.collection}</p>
              </div>
            )}

            {fabric.designerName && (
              <div>
                <span className="text-sm text-gray-500 block">Designer</span>
                <p className="font-medium text-lg">{fabric.designerName}</p>
              </div>
            )}

            {fabric.countryOfOrigin && (
              <div>
                <span className="text-sm text-gray-500 block">Country of Origin</span>
                <p className="font-medium text-lg">{fabric.countryOfOrigin}</p>
              </div>
            )}

            {fabric.primaryColor && (
              <div>
                <span className="text-sm text-gray-500 block">Primary Color</span>
                <div className="flex items-center gap-2">
                  {fabric.colorHex && (
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: fabric.colorHex }}
                    />
                  )}
                  <p className="font-medium">{fabric.primaryColor}</p>
                </div>
              </div>
            )}

            {fabric.secondaryColors && fabric.secondaryColors.length > 0 && (
              <div className="md:col-span-2">
                <span className="text-sm text-gray-500 block">Additional Colors</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {fabric.secondaryColors.map((color: any, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Care & Maintenance */}
        {(fabric.careInstructions || fabric.cleaningCode || fabric.warrantyInfo) && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Care & Maintenance</h2>
            
            {fabric.careInstructions && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Care Instructions</h3>
                {Array.isArray(fabric.careInstructions) ? (
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {fabric.careInstructions.map((instruction: any, index: number) => (
                      <li key={index}>{instruction}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">{fabric.careInstructions}</p>
                )}
              </div>
            )}

            {fabric.cleaningCode && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Professional Cleaning Code</h3>
                <span className="bg-gray-100 px-3 py-1 rounded text-lg font-mono">
                  {fabric.cleaningCode}
                </span>
              </div>
            )}

            {fabric.warrantyInfo && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Warranty Information</h3>
                <p className="text-gray-700">{fabric.warrantyInfo}</p>
              </div>
            )}
          </div>
        )}

        {/* Certifications */}
        {fabric.certifications && fabric.certifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Certifications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fabric.certifications.map((cert: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                  <p className="text-sm text-gray-600">Issued by: {cert.issuer}</p>
                  <p className="text-sm text-gray-600">Date: {new Date(cert.date).toLocaleDateString()}</p>
                  {cert.expiryDate && (
                    <p className="text-sm text-gray-600">
                      Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {(fabric.flammabilityStandard || fabric.environmentalRating) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {fabric.flammabilityStandard && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Flammability Standard:</span>
                    <span className="ml-2 font-medium">{fabric.flammabilityStandard}</span>
                  </div>
                )}
                {fabric.environmentalRating && (
                  <div>
                    <span className="text-sm text-gray-500">Environmental Rating:</span>
                    <span className="ml-2 font-medium">{fabric.environmentalRating}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Usage Suitability & Additional Features */}
        {(fabric.usageSuitability || fabric.additionalFeatures) && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Usage Suitability & Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {fabric.usageSuitability && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Suitable For</h3>
                  <div className="space-y-2">
                    {Object.entries(fabric.usageSuitability)
                      .filter(([_, value]) => value === true)
                      .map(([key, _]) => (
                        <div key={key} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {fabric.additionalFeatures && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Features</h3>
                  <div className="space-y-3">
                    {fabric.additionalFeatures.acousticProperties && (
                      <div>
                        <span className="text-sm text-gray-500">Acoustic Properties</span>
                        <p className="text-sm">{fabric.additionalFeatures.acousticProperties.description}</p>
                        {fabric.additionalFeatures.acousticProperties.nrc && (
                          <p className="text-sm">NRC: {fabric.additionalFeatures.acousticProperties.nrc}</p>
                        )}
                      </div>
                    )}
                    
                    {fabric.additionalFeatures.sustainabilityNotes && (
                      <div>
                        <span className="text-sm text-gray-500">Sustainability</span>
                        <p className="text-sm">{fabric.additionalFeatures.sustainabilityNotes}</p>
                      </div>
                    )}

                    {fabric.additionalFeatures.customizationOptions && (
                      <div>
                        <span className="text-sm text-gray-500">Customization Options</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {fabric.additionalFeatures.customizationOptions.map((option: any, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              {option}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <h3 className="text-lg font-semibold mb-1">Interested in this fabric?</h3>
              <p className="text-gray-600">Contact us for samples, custom orders, or more information.</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Request Sample
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                Get Quote
              </button>
              {fabric.technicalDocuments?.specSheet && (
                <a
                  href={fabric.technicalDocuments.specSheet}
                  className="border border-blue-300 text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Spec Sheet
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}