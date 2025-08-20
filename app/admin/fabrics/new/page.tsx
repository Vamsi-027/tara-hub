"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Info,
  DollarSign,
  Package,
  Palette,
  Ruler,
  Image as ImageIcon,
  Building2
} from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"
import { useCreateFabric } from "@/modules/fabrics"
import { toast } from "sonner"
import Link from "next/link"
import { 
  PerformanceTab, 
  CareAndTreatmentTab, 
  TechnicalSpecsTab,
  CertificationsTab,
  UsageSuitabilityTab 
} from "../components/fabric-form-tabs"

const fabricTypes = [
  'Upholstery', 'Drapery', 'Multi-Purpose', 'Outdoor', 'Sheer', 'Blackout'
]

const fabricStatuses = [
  'Active', 'Discontinued', 'Out of Stock', 'Coming Soon', 'Sale', 'Clearance'
]

const durabilityRatings = [
  'Light Duty', 'Medium Duty', 'Heavy Duty', 'Extra Heavy Duty'
]

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' }
]

const priceUnits = [
  { value: 'per_yard', label: 'Per Yard' },
  { value: 'per_meter', label: 'Per Meter' },
  { value: 'per_foot', label: 'Per Foot' },
  { value: 'per_piece', label: 'Per Piece' },
  { value: 'per_roll', label: 'Per Roll' }
]

const widthUnits = [
  { value: 'inches', label: 'Inches' },
  { value: 'cm', label: 'Centimeters' },
  { value: 'meters', label: 'Meters' },
  { value: 'feet', label: 'Feet' }
]

const weightUnits = [
  { value: 'oz/yd', label: 'Ounces per Yard' },
  { value: 'g/m²', label: 'Grams per Square Meter' },
  { value: 'kg/m²', label: 'Kilograms per Square Meter' },
  { value: 'oz/ft²', label: 'Ounces per Square Foot' }
]

const cleaningCodes = [
  { value: 'W', label: 'W - Water Based Cleaning' },
  { value: 'S', label: 'S - Solvent Based Cleaning' },
  { value: 'WS', label: 'WS - Water or Solvent Based' },
  { value: 'X', label: 'X - Vacuum or Brush Only' },
  { value: 'DC', label: 'DC - Dry Clean Only' }
]

const stockUnits = ['yards', 'meters', 'feet', 'rolls', 'pieces', 'hides']

export default function NewFabricPage() {
  const router = useRouter()
  const { create, loading } = useCreateFabric()
  
  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    type: 'Upholstery',
    status: 'Active',
    brand: '',
    collection: '',
    category: '',
    style: '',
    material: '',
    pattern: '',
    colorFamily: '',
    width: '',
    widthUnit: 'inches',
    weight: '',
    weightUnit: 'oz/yd',
    thickness: '',
    durabilityRating: '',
    cleaningCode: '',
    supplierId: '',
    supplierName: '',
    stockQuantity: '0',
    stockUnit: 'yards',
    lowStockThreshold: '10',
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    metaTitle: '',
    metaDescription: '',
    images: [] as string[],
    // Performance fields
    martindale: '',
    wyzenbeek: '',
    lightfastness: '',
    pillingResistance: '',
    // Treatment features
    isStainResistant: false,
    isFadeResistant: false,
    isWaterResistant: false,
    isPetFriendly: false,
    isOutdoorSafe: false,
    isFireRetardant: false,
    isBleachCleanable: false,
    isAntimicrobial: false,
    // Additional fields
    fiberContent: [] as Array<{ fiber: string; percentage: number }>,
    backingType: '',
    finishTreatment: '',
    countryOfOrigin: '',
    minimumOrder: '1',
    incrementQuantity: '1',
    leadTimeDays: '',
    isCustomOrder: false,
    careInstructions: [] as string[],
    certifications: [] as Array<{ name: string; issuer: string; date: string }>,
    flammabilityStandard: '',
    environmentalRating: '',
    publicNotes: '',
    warrantyInfo: '',
    returnPolicy: '',
    tags: [] as string[],
    // JSON fields
    performanceMetrics: {},
    usageSuitability: {},
    additionalFeatures: {},
    technicalDocuments: {},
  })
  
  // UI state
  const [colors, setColors] = useState<string[]>([])
  const [newColor, setNewColor] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Required fields
    if (!formData.sku.trim()) {
      errors.sku = 'SKU is required'
    } else if (!/^[A-Z0-9-]+$/i.test(formData.sku)) {
      errors.sku = 'SKU can only contain letters, numbers, and hyphens'
    }
    
    if (!formData.name.trim()) {
      errors.name = 'Fabric name is required'
    } else if (formData.name.length < 3) {
      errors.name = 'Name must be at least 3 characters'
    }
    
    
    if (formData.width && parseFloat(formData.width) <= 0) {
      errors.width = 'Width must be greater than 0'
    }
    
    if (formData.weight && parseFloat(formData.weight) <= 0) {
      errors.weight = 'Weight must be greater than 0'
    }
    
    if (parseInt(formData.stockQuantity) < 0) {
      errors.stockQuantity = 'Stock quantity cannot be negative'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error for this field when user types
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }
  
  const handleAddColor = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      setColors([...colors, newColor.trim()])
      setNewColor('')
    }
  }
  
  const handleRemoveColor = (color: string) => {
    setColors(colors.filter(c => c !== color))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      // Find first tab with error
      if (validationErrors.sku || validationErrors.name || validationErrors.description) {
        setActiveTab('basic')
      } else if (validationErrors.stockQuantity) {
        setActiveTab('inventory')
      }
      
      toast.error('Please fix the errors before submitting')
      return
    }
    
    try {
      // Generate slug from name
      const slug = formData.name.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      
      // Prepare data with proper type conversion
      const fabricData = {
        ...formData,
        slug,
        colors: colors.length > 0 ? colors : ['Default'],
        width: formData.width ? parseFloat(formData.width) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        stockQuantity: parseInt(formData.stockQuantity),
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        images: formData.images || [],
        specifications: {},
        customFields: {}
      }
      
      await create(fabricData)
      setShowSuccess(true)
      // The useCreateFabric hook handles navigation
      
    } catch (err: any) {
      console.error('Failed to create fabric:', err)
      toast.error(err.message || 'Failed to create fabric. Please try again.')
    }
  }
  
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/fabrics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Fabric</h1>
            <p className="text-muted-foreground">
              Fill in the details to add a new fabric to your inventory
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Fabric'}
          </Button>
        </div>
      </div>
      
      {/* Success Alert */}
      {showSuccess && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Fabric created successfully! Redirecting to fabrics list...
          </AlertDescription>
        </Alert>
      )}
      
      {/* Error Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-1">Please fix the following errors:</div>
            <ul className="list-disc list-inside text-sm">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Form Tabs */}
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-2">
            <TabsTrigger value="basic">
              Basic Info
              {(validationErrors.sku || validationErrors.name) && (
                <AlertCircle className="ml-1 h-3 w-3 text-red-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="images">
              <ImageIcon className="mr-1 h-3 w-3" />
              Images
            </TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="care">Care & Treatment</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="procurement">Procurement</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suitability">Usage</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
          
          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Essential details about the fabric. Fields marked with * are required.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="sku">
                      SKU * 
                      {validationErrors.sku && (
                        <span className="text-red-500 text-xs ml-2">{validationErrors.sku}</span>
                      )}
                    </Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                      placeholder="e.g., FAB-001"
                      className={validationErrors.sku ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      Unique identifier for this fabric
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Name *
                      {validationErrors.name && (
                        <span className="text-red-500 text-xs ml-2">{validationErrors.name}</span>
                      )}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g., Premium Velvet - Emerald Green"
                      className={validationErrors.name ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-muted-foreground">
                      Display name for the fabric
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe the fabric's features, texture, and ideal uses..."
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Detailed description for customers
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Fabric Type *</Label>
                    <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fabricTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fabricStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => handleChange('isActive', checked)}
                    />
                    <Label htmlFor="isActive">Active (visible in catalog)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => handleChange('isFeatured', checked)}
                    />
                    <Label htmlFor="isFeatured">Featured (show on homepage)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Fabric Details</CardTitle>
                <CardDescription>
                  Additional information about the fabric's characteristics
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      placeholder="e.g., Luxury Textiles"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="collection">Collection</Label>
                    <Input
                      id="collection"
                      value={formData.collection}
                      onChange={(e) => handleChange('collection', e.target.value)}
                      placeholder="e.g., Spring 2024"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={formData.material}
                      onChange={(e) => handleChange('material', e.target.value)}
                      placeholder="e.g., 100% Cotton"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="pattern">Pattern</Label>
                    <Input
                      id="pattern"
                      value={formData.pattern}
                      onChange={(e) => handleChange('pattern', e.target.value)}
                      placeholder="e.g., Solid, Striped, Floral"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="width">
                      Width
                      {validationErrors.width && (
                        <span className="text-red-500 text-xs ml-2">{validationErrors.width}</span>
                      )}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="width"
                        type="number"
                        step="0.01"
                        value={formData.width}
                        onChange={(e) => handleChange('width', e.target.value)}
                        placeholder="e.g., 54"
                        className={`flex-1 ${validationErrors.width ? 'border-red-500' : ''}`}
                      />
                      <Select
                        value={formData.widthUnit}
                        onValueChange={(value) => handleChange('widthUnit', value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {widthUnits.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="weight">
                      Weight
                      {validationErrors.weight && (
                        <span className="text-red-500 text-xs ml-2">{validationErrors.weight}</span>
                      )}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={formData.weight}
                        onChange={(e) => handleChange('weight', e.target.value)}
                        placeholder="e.g., 12.5"
                        className={`flex-1 ${validationErrors.weight ? 'border-red-500' : ''}`}
                      />
                      <Select
                        value={formData.weightUnit}
                        onValueChange={(value) => handleChange('weightUnit', value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {weightUnits.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="durabilityRating">Durability Rating</Label>
                    <Select
                      value={formData.durabilityRating}
                      onValueChange={(value) => handleChange('durabilityRating', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select durability rating" />
                      </SelectTrigger>
                      <SelectContent>
                        {durabilityRatings.map(rating => (
                          <SelectItem key={rating} value={rating}>
                            {rating}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="cleaningCode">Cleaning Code</Label>
                    <Select
                      value={formData.cleaningCode}
                      onValueChange={(value) => handleChange('cleaningCode', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cleaning code" />
                      </SelectTrigger>
                      <SelectContent>
                        {cleaningCodes.map(code => (
                          <SelectItem key={code.value} value={code.value}>
                            {code.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Colors Section */}
                <div className="grid gap-2">
                  <Label>Available Colors</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="Enter color name"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                    />
                    <Button type="button" onClick={handleAddColor} variant="secondary">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Color
                    </Button>
                  </div>
                  {colors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {colors.map(color => (
                        <Badge key={color} variant="secondary" className="px-3 py-1">
                          {color}
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(color)}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Add available color options for this fabric
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Images Tab */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Fabric Images
                </CardTitle>
                <CardDescription>
                  Upload high-quality images to showcase your fabric. The first image will be the primary display.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  images={formData.images || []}
                  onChange={(images) => handleChange('images', images)}
                  maxImages={20}
                  maxFileSize={10}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Procurement Tab */}
          <TabsContent value="procurement">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Procurement Information
                </CardTitle>
                <CardDescription>
                  Manage supplier and procurement details for this fabric
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Track procurement cost and supplier information.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4">
                  {/* Currency and Price Unit */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => handleChange('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(currency => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="priceUnit">Price Unit</Label>
                      <Select
                        value={formData.priceUnit}
                        onValueChange={(value) => handleChange('priceUnit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priceUnits.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Procurement Cost */}
                  <div className="grid gap-2">
                    <Label htmlFor="procurementCost">
                      Procurement Cost
                      {validationErrors.procurementCost && (
                        <span className="text-red-500 text-xs ml-2">{validationErrors.procurementCost}</span>
                      )}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
                        {formData.currency}
                      </span>
                      <Input
                        id="procurementCost"
                        type="number"
                        step="0.01"
                        value={formData.procurementCost}
                        onChange={(e) => handleChange('procurementCost', e.target.value)}
                        placeholder="0.00"
                        className={`pl-12 ${validationErrors.procurementCost ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cost {formData.priceUnit.replace('_', ' ')} from supplier
                    </p>
                  </div>
                  
                  {/* Supplier Information */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="supplierId">
                        Supplier ID
                        {validationErrors.supplierId && (
                          <span className="text-red-500 text-xs ml-2">{validationErrors.supplierId}</span>
                        )}
                      </Label>
                      <Input
                        id="supplierId"
                        value={formData.supplierId}
                        onChange={(e) => handleChange('supplierId', e.target.value)}
                        placeholder="SUP-001"
                        className={validationErrors.supplierId ? 'border-red-500' : ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        Unique supplier identifier
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="supplierName">
                        Supplier Name
                        {validationErrors.supplierName && (
                          <span className="text-red-500 text-xs ml-2">{validationErrors.supplierName}</span>
                        )}
                      </Label>
                      <Input
                        id="supplierName"
                        value={formData.supplierName}
                        onChange={(e) => handleChange('supplierName', e.target.value)}
                        placeholder="ABC Textiles Co."
                        className={validationErrors.supplierName ? 'border-red-500' : ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        Supplier company name
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Procurement Summary */}
                {(formData.procurementCost || formData.supplierId || formData.supplierName) && (
                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Procurement Summary</h4>
                    <div className="grid gap-1 text-sm">
                      {formData.procurementCost && (
                        <div className="flex justify-between">
                          <span>Cost:</span>
                          <span className="font-semibold">
                            {formData.currency} {formData.procurementCost} {formData.priceUnit.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                      {formData.supplierName && (
                        <div className="flex justify-between">
                          <span>Supplier:</span>
                          <span className="font-semibold">{formData.supplierName}</span>
                        </div>
                      )}
                      {formData.supplierId && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Supplier ID:</span>
                          <span>{formData.supplierId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Inventory Tab */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
                <CardDescription>
                  Track stock levels and set reorder points
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="stockQuantity">
                      Stock Quantity
                      {validationErrors.stockQuantity && (
                        <span className="text-red-500 text-xs ml-2">{validationErrors.stockQuantity}</span>
                      )}
                    </Label>
                    <div className="relative">
                      <Package className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="stockQuantity"
                        type="number"
                        value={formData.stockQuantity}
                        onChange={(e) => handleChange('stockQuantity', e.target.value)}
                        placeholder="0"
                        className={`pl-9 ${validationErrors.stockQuantity ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current quantity in stock
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="stockUnit">Stock Unit</Label>
                    <Select value={formData.stockUnit} onValueChange={(value) => handleChange('stockUnit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stockUnits.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Unit of measurement
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={formData.lowStockThreshold}
                      onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
                      placeholder="10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Alert when stock falls below this level
                    </p>
                  </div>
                </div>
                
                {/* Stock Status Preview */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">Stock Status Preview:</div>
                    {parseInt(formData.stockQuantity) === 0 && (
                      <Badge variant="destructive">Out of Stock</Badge>
                    )}
                    {parseInt(formData.stockQuantity) > 0 && 
                     parseInt(formData.stockQuantity) <= parseInt(formData.lowStockThreshold) && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        Low Stock ({formData.stockQuantity} {formData.stockUnit} remaining)
                      </Badge>
                    )}
                    {parseInt(formData.stockQuantity) > parseInt(formData.lowStockThreshold) && (
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        In Stock ({formData.stockQuantity} {formData.stockUnit} available)
                      </Badge>
                    )}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* SEO Tab */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO & Meta Information</CardTitle>
                <CardDescription>
                  Optimize for search engines (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => handleChange('metaTitle', e.target.value)}
                    placeholder="Leave empty to use fabric name"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.metaTitle.length}/60 characters
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => handleChange('metaDescription', e.target.value)}
                    placeholder="Leave empty to use fabric description"
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.metaDescription.length}/160 characters
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Performance Tab */}
          <PerformanceTab 
            formData={formData}
            handleChange={handleChange}
            validationErrors={validationErrors}
          />
          
          {/* Care & Treatment Tab */}
          <CareAndTreatmentTab
            formData={formData}
            handleChange={handleChange}
            validationErrors={validationErrors}
          />
          
          {/* Technical Specs Tab */}
          <TechnicalSpecsTab
            formData={formData}
            handleChange={handleChange}
            validationErrors={validationErrors}
          />
          
          {/* Certifications Tab */}
          <CertificationsTab
            formData={formData}
            handleChange={handleChange}
            validationErrors={validationErrors}
          />
          
          {/* Usage & Suitability Tab */}
          <UsageSuitabilityTab
            formData={formData}
            handleChange={handleChange}
            validationErrors={validationErrors}
          />
        </Tabs>
        
        {/* Bottom Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Fabric'}
          </Button>
        </div>
      </form>
    </div>
  )
}