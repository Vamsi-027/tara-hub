import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Input, Label, Textarea, Select, Switch, Badge, Tabs, Text, toast, Toaster } from "@medusajs/ui"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, XMarkMini, ArrowLeft } from "@medusajs/icons"
import { createProductWorkflow } from "@medusajs/medusa/core-flows"

const CreateFabricProduct = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  
  // Basic product data
  const [productData, setProductData] = useState({
    title: "",
    handle: "",
    description: "",
    status: "draft" as "draft" | "published",
    thumbnail: "",
    images: [] as string[],
    options: [
      {
        title: "Type",
        values: ["Swatch", "Fabric"]
      }
    ],
    variants: [] as any[]
  })

  // Fabric metadata
  const [metadata, setMetadata] = useState<Record<string, any>>({
    // Basic Info
    brand: "",
    category: "",
    collection: "",
    pattern: "",
    style: "",
    grade: "",
    
    // Colors
    color: "",
    color_family: "",
    color_hex: "#000000",
    
    // Physical
    composition: "",
    width: "",
    weight: "",
    h_repeat: "",
    v_repeat: "",
    
    // Performance
    usage: "Indoor",
    durability: "",
    martindale: "",
    care_instructions: "",
    cleaning_code: "",
    
    // Features
    stain_resistant: false,
    fade_resistant: false,
    washable: false,
    bleach_cleanable: false,
    ca_117: false,
    quick_ship: false,
    is_featured: false,
    
    // Business
    supplier_name: "",
    stock_unit: "yard",
    minimum_order_yards: "1",
    swatch_size: "4x4 inches",
    swatch_price: 5,
    
    // Properties
    properties: [] as string[]
  })

  const [newProperty, setNewProperty] = useState("")
  const [newImage, setNewImage] = useState("")
  const [variantPrices, setVariantPrices] = useState({
    swatch: 5,
    fabric: 99
  })

  const updateField = (field: string, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateProductField = (field: string, value: any) => {
    setProductData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addProperty = () => {
    if (newProperty.trim()) {
      updateField('properties', [...metadata.properties, newProperty.trim()])
      setNewProperty("")
    }
  }

  const removeProperty = (index: number) => {
    updateField('properties', metadata.properties.filter((_: any, i: number) => i !== index))
  }

  const addImage = () => {
    if (newImage.trim()) {
      updateProductField('images', [...productData.images, newImage.trim()])
      if (!productData.thumbnail) {
        updateProductField('thumbnail', newImage.trim())
      }
      setNewImage("")
    }
  }

  const removeImage = (index: number) => {
    const updatedImages = productData.images.filter((_, i) => i !== index)
    updateProductField('images', updatedImages)
    if (productData.thumbnail === productData.images[index] && updatedImages.length > 0) {
      updateProductField('thumbnail', updatedImages[0])
    }
  }

  const handleCreate = async () => {
    // Validate required fields
    if (!productData.title) {
      toast.error("Product title is required")
      return
    }

    setIsLoading(true)

    try {
      // Add timestamp to handle to avoid duplicates
      const timestamp = Date.now()
      const handle = productData.handle || `${productData.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`
      const skuBase = productData.handle || `${productData.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`
      
      // Prepare variants with both swatch and fabric options - using unique SKUs
      const variants = [
        {
          title: "Swatch Sample",
          sku: `${skuBase}-SWATCH`,
          options: { Type: "Swatch" },
          prices: [{ amount: variantPrices.swatch * 100, currency_code: "usd" }]
        },
        {
          title: "Fabric Per Yard",
          sku: `${skuBase}-YARD`,
          options: { Type: "Fabric" },
          prices: [{ amount: variantPrices.fabric * 100, currency_code: "usd" }]
        }
      ]

      // Create product with metadata
      
      const response = await fetch('/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: productData.title,
          handle: handle,
          description: productData.description,
          status: productData.status,
          thumbnail: productData.thumbnail,
          images: productData.images,
          options: productData.options,
          variants,
          metadata: {
            ...metadata,
            swatch_price: variantPrices.swatch,
            price: variantPrices.fabric
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Fabric product created successfully!")
        setTimeout(() => navigate('/products'), 1500)
      } else {
        const error = await response.json()
        console.error('Product creation error:', error)
        throw new Error(error.details || error.error || 'Failed to create product')
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create product"
      toast.error(errorMessage)
      console.error('Full error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const patternOptions = [
    'Solid', 'Stripe', 'Plaid', 'Floral', 'Geometric', 
    'Abstract', 'Herringbone', 'Damask', 'Paisley', 'Textured'
  ]

  const usageOptions = ['Indoor', 'Outdoor', 'Both']
  const gradeOptions = ['Residential', 'Light Commercial', 'Heavy Commercial', 'Contract']
  const categoryOptions = ['Upholstery', 'Drapery', 'Multi-Purpose', 'Outdoor', 'Leather', 'Vinyl']

  return (
    <Container className="divide-y">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="small"
            onClick={() => navigate('/products')}
          >
            <ArrowLeft className="mr-2" />
            Back
          </Button>
          <div>
            <Heading level="h1">Create New Fabric Product</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Add a new fabric with detailed specifications
            </Text>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/products')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="basic">Product Info</Tabs.Trigger>
            <Tabs.Trigger value="specs">Fabric Specifications</Tabs.Trigger>
            <Tabs.Trigger value="physical">Physical Properties</Tabs.Trigger>
            <Tabs.Trigger value="features">Features & Care</Tabs.Trigger>
            <Tabs.Trigger value="pricing">Pricing & Inventory</Tabs.Trigger>
            <Tabs.Trigger value="media">Images</Tabs.Trigger>
          </Tabs.List>

          {/* Product Info Tab */}
          <Tabs.Content value="basic" className="py-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label required>Product Title</Label>
                <Input
                  value={productData.title}
                  onChange={(e) => updateProductField('title', e.target.value)}
                  placeholder="e.g., Premium Navy Canvas"
                />
              </div>
              <div className="space-y-2">
                <Label>Handle (URL Slug)</Label>
                <Input
                  value={productData.handle}
                  onChange={(e) => updateProductField('handle', e.target.value)}
                  placeholder="premium-navy-canvas"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={productData.description}
                onChange={(e) => updateProductField('description', e.target.value)}
                placeholder="Enter product description..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label required>Brand</Label>
                <Input
                  value={metadata.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                  placeholder="Brand name"
                />
              </div>
              <div className="space-y-2">
                <Label required>Category</Label>
                <Select
                  value={metadata.category}
                  onValueChange={(value) => updateField('category', value)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select category" />
                  </Select.Trigger>
                  <Select.Content>
                    {categoryOptions.map(option => (
                      <Select.Item key={option} value={option}>
                        {option}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Collection</Label>
                <Input
                  value={metadata.collection}
                  onChange={(e) => updateField('collection', e.target.value)}
                  placeholder="Collection name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={productData.status}
                  onValueChange={(value: "draft" | "published") => updateProductField('status', value)}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="draft">Draft</Select.Item>
                    <Select.Item value="published">Published</Select.Item>
                  </Select.Content>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Featured Product</Label>
                <Switch
                  checked={metadata.is_featured}
                  onCheckedChange={(checked) => updateField('is_featured', checked)}
                />
              </div>
            </div>
          </Tabs.Content>

          {/* Fabric Specifications Tab */}
          <Tabs.Content value="specs" className="py-6 space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label required>Primary Color</Label>
                <Input
                  value={metadata.color}
                  onChange={(e) => updateField('color', e.target.value)}
                  placeholder="e.g., Navy Blue"
                />
              </div>
              <div className="space-y-2">
                <Label>Color Family</Label>
                <Input
                  value={metadata.color_family}
                  onChange={(e) => updateField('color_family', e.target.value)}
                  placeholder="e.g., Blue"
                />
              </div>
              <div className="space-y-2">
                <Label>Color Hex</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={metadata.color_hex}
                    onChange={(e) => updateField('color_hex', e.target.value)}
                    className="w-12 h-9 rounded border cursor-pointer"
                  />
                  <Input
                    value={metadata.color_hex}
                    onChange={(e) => updateField('color_hex', e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label required>Pattern</Label>
                <Select
                  value={metadata.pattern}
                  onValueChange={(value) => updateField('pattern', value)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select pattern" />
                  </Select.Trigger>
                  <Select.Content>
                    {patternOptions.map(option => (
                      <Select.Item key={option} value={option}>
                        {option}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Style</Label>
                <Input
                  value={metadata.style}
                  onChange={(e) => updateField('style', e.target.value)}
                  placeholder="e.g., Contemporary"
                />
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select
                  value={metadata.grade}
                  onValueChange={(value) => updateField('grade', value)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select grade" />
                  </Select.Trigger>
                  <Select.Content>
                    {gradeOptions.map(option => (
                      <Select.Item key={option} value={option}>
                        {option}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input
                  value={metadata.supplier_name}
                  onChange={(e) => updateField('supplier_name', e.target.value)}
                  placeholder="Supplier name"
                />
              </div>
              <div className="space-y-2">
                <Label>SKU Prefix</Label>
                <Input
                  value={productData.handle}
                  onChange={(e) => updateProductField('handle', e.target.value)}
                  placeholder="FAB-NAVY-001"
                />
              </div>
            </div>
          </Tabs.Content>

          {/* Physical Properties Tab */}
          <Tabs.Content value="physical" className="py-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label required>Material Composition</Label>
                <Input
                  value={metadata.composition}
                  onChange={(e) => updateField('composition', e.target.value)}
                  placeholder="e.g., 100% Polyester"
                />
              </div>
              <div className="space-y-2">
                <Label required>Width</Label>
                <Input
                  value={metadata.width}
                  onChange={(e) => updateField('width', e.target.value)}
                  placeholder="e.g., 54 inches"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Weight</Label>
                <Input
                  value={metadata.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  placeholder="e.g., 12 oz per yard"
                />
              </div>
              <div className="space-y-2">
                <Label>Usage</Label>
                <Select
                  value={metadata.usage}
                  onValueChange={(value) => updateField('usage', value)}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {usageOptions.map(option => (
                      <Select.Item key={option} value={option}>
                        {option}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Horizontal Repeat</Label>
                <Input
                  value={metadata.h_repeat}
                  onChange={(e) => updateField('h_repeat', e.target.value)}
                  placeholder="e.g., 14 inches"
                />
              </div>
              <div className="space-y-2">
                <Label>Vertical Repeat</Label>
                <Input
                  value={metadata.v_repeat}
                  onChange={(e) => updateField('v_repeat', e.target.value)}
                  placeholder="e.g., 12 inches"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Durability Rating</Label>
                <Input
                  value={metadata.durability}
                  onChange={(e) => updateField('durability', e.target.value)}
                  placeholder="e.g., Heavy Duty - 50,000 double rubs"
                />
              </div>
              <div className="space-y-2">
                <Label>Martindale Rating</Label>
                <Input
                  type="number"
                  value={metadata.martindale}
                  onChange={(e) => updateField('martindale', e.target.value)}
                  placeholder="e.g., 50000"
                />
              </div>
            </div>
          </Tabs.Content>

          {/* Features & Care Tab */}
          <Tabs.Content value="features" className="py-6 space-y-6">
            <div className="space-y-2">
              <Label>Care Instructions</Label>
              <Textarea
                value={metadata.care_instructions}
                onChange={(e) => updateField('care_instructions', e.target.value)}
                placeholder="Enter detailed care instructions..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Cleaning Code</Label>
                <Input
                  value={metadata.cleaning_code}
                  onChange={(e) => updateField('cleaning_code', e.target.value)}
                  placeholder="e.g., W, S, WS"
                />
              </div>
              <div className="space-y-2">
                <Label>Swatch Size</Label>
                <Input
                  value={metadata.swatch_size}
                  onChange={(e) => updateField('swatch_size', e.target.value)}
                  placeholder="e.g., 4x4 inches"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Special Features</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label className="cursor-pointer">Stain Resistant</Label>
                  <Switch
                    checked={metadata.stain_resistant}
                    onCheckedChange={(checked) => updateField('stain_resistant', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label className="cursor-pointer">Fade Resistant</Label>
                  <Switch
                    checked={metadata.fade_resistant}
                    onCheckedChange={(checked) => updateField('fade_resistant', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label className="cursor-pointer">Machine Washable</Label>
                  <Switch
                    checked={metadata.washable}
                    onCheckedChange={(checked) => updateField('washable', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label className="cursor-pointer">Bleach Safe</Label>
                  <Switch
                    checked={metadata.bleach_cleanable}
                    onCheckedChange={(checked) => updateField('bleach_cleanable', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label className="cursor-pointer">CA 117 Compliant</Label>
                  <Switch
                    checked={metadata.ca_117}
                    onCheckedChange={(checked) => updateField('ca_117', checked)}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label className="cursor-pointer">Quick Ship</Label>
                  <Switch
                    checked={metadata.quick_ship}
                    onCheckedChange={(checked) => updateField('quick_ship', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Properties</Label>
              <div className="flex gap-2">
                <Input
                  value={newProperty}
                  onChange={(e) => setNewProperty(e.target.value)}
                  placeholder="Add property (e.g., Water Resistant)"
                  onKeyPress={(e) => e.key === 'Enter' && addProperty()}
                />
                <Button
                  variant="secondary"
                  size="base"
                  onClick={addProperty}
                  type="button"
                >
                  <Plus />
                </Button>
              </div>
              {metadata.properties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {metadata.properties.map((prop: string, index: number) => (
                    <Badge key={index} size="large" className="flex items-center gap-1">
                      {prop}
                      <button
                        onClick={() => removeProperty(index)}
                        className="ml-1 hover:text-red-500"
                        type="button"
                      >
                        <XMarkMini className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Tabs.Content>

          {/* Pricing & Inventory Tab */}
          <Tabs.Content value="pricing" className="py-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <Heading level="h3">Swatch Variant</Heading>
                <div className="space-y-2">
                  <Label>Swatch Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variantPrices.swatch}
                    onChange={(e) => setVariantPrices(prev => ({ ...prev, swatch: parseFloat(e.target.value) || 0 }))}
                    placeholder="5.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU (auto-generated)</Label>
                  <Input
                    value={`${productData.handle || productData.title?.toLowerCase().replace(/\s+/g, '-') || 'SKU'}-[timestamp]-SWATCH`}
                    disabled
                    className="bg-ui-bg-subtle"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Heading level="h3">Fabric Variant (Per Yard)</Heading>
                <div className="space-y-2">
                  <Label>Fabric Price (USD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={variantPrices.fabric}
                    onChange={(e) => setVariantPrices(prev => ({ ...prev, fabric: parseFloat(e.target.value) || 0 }))}
                    placeholder="99.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU (auto-generated)</Label>
                  <Input
                    value={`${productData.handle || productData.title?.toLowerCase().replace(/\s+/g, '-') || 'SKU'}-[timestamp]-YARD`}
                    disabled
                    className="bg-ui-bg-subtle"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Stock Unit</Label>
                <Select
                  value={metadata.stock_unit}
                  onValueChange={(value) => updateField('stock_unit', value)}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="yard">Yard</Select.Item>
                    <Select.Item value="meter">Meter</Select.Item>
                    <Select.Item value="roll">Roll</Select.Item>
                  </Select.Content>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Minimum Order</Label>
                <Input
                  value={metadata.minimum_order_yards}
                  onChange={(e) => updateField('minimum_order_yards', e.target.value)}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
                <Input
                  type="number"
                  value={metadata.low_stock_threshold}
                  onChange={(e) => updateField('low_stock_threshold', e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
          </Tabs.Content>

          {/* Media Tab */}
          <Tabs.Content value="media" className="py-6 space-y-6">
            <div className="space-y-2">
              <Label>Product Images</Label>
              <div className="flex gap-2">
                <Input
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  placeholder="Enter image URL"
                  onKeyPress={(e) => e.key === 'Enter' && addImage()}
                />
                <Button
                  variant="secondary"
                  size="base"
                  onClick={addImage}
                  type="button"
                >
                  Add Image
                </Button>
              </div>
            </div>

            {productData.images.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Images</Label>
                <div className="grid grid-cols-4 gap-4">
                  {productData.images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Product image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      {productData.thumbnail === url && (
                        <Badge className="absolute top-2 left-2" size="small">
                          Thumbnail
                        </Badge>
                      )}
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        type="button"
                      >
                        <XMarkMini className="w-4 h-4" />
                      </button>
                      {productData.thumbnail !== url && (
                        <button
                          onClick={() => updateProductField('thumbnail', url)}
                          className="absolute bottom-2 left-2 text-xs bg-blue-500 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                        >
                          Set as Thumbnail
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Tabs.Content>
        </Tabs>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Create Fabric Product",
  icon: Plus,
})

export default CreateFabricProduct