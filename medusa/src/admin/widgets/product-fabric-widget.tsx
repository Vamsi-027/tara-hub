import React, { useState, useEffect } from "react"
import { 
  Container, 
  Heading, 
  Text, 
  Input, 
  Select, 
  Checkbox, 
  Label,
  Button,
  Badge,
  Tabs
} from "@medusajs/ui"
import { ProductDetailsWidgetProps, WidgetConfig } from "@medusajs/admin-sdk"

// Define fabric field types
interface FabricMetadata {
  // Basic Properties
  category?: string
  collection?: string
  brand?: string
  pattern?: string
  style?: string
  grade?: string
  
  // Color Information
  color?: string
  color_family?: string
  color_hex?: string
  primary_color?: string
  secondary_colors?: string[]
  
  // Physical Specifications
  composition?: string
  width?: string
  weight?: string
  h_repeat?: string
  v_repeat?: string
  
  // Performance & Usage
  usage?: 'Indoor' | 'Outdoor' | 'Both'
  durability?: string
  martindale?: number
  types?: string
  performance_metrics?: string
  
  // Care & Maintenance
  care_instructions?: string
  cleaning_code?: string
  washable?: boolean
  bleach_cleanable?: boolean
  
  // Special Features
  stain_resistant?: boolean
  fade_resistant?: boolean
  ca_117?: boolean
  quick_ship?: boolean
  closeout?: boolean
  is_featured?: boolean
  properties?: string[]
  
  // Business Information
  supplier_name?: string
  availability?: string
  stock_unit?: string
  low_stock_threshold?: number
  procurement_cost?: number
  
  // Swatch Specific
  swatch_price?: number
  swatch_size?: string
  swatch_in_stock?: boolean
  minimum_order_yards?: string
  
  // Documentation
  technical_documents?: string
  cleaning_pdf?: string
  keywords?: string
  version?: string
}

const ProductFabricWidget = ({ 
  product, 
  notify 
}: ProductDetailsWidgetProps) => {
  const [metadata, setMetadata] = useState<FabricMetadata>({})
  const [activeTab, setActiveTab] = useState("basic")
  const [isSaving, setIsSaving] = useState(false)

  // Load existing metadata
  useEffect(() => {
    if (product?.metadata) {
      setMetadata(product.metadata as FabricMetadata)
    }
  }, [product])

  // Save metadata
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/admin/products/${product.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: metadata
        })
      })

      if (response.ok) {
        notify.success("Success", "Fabric specifications saved successfully")
      } else {
        notify.error("Error", "Failed to save fabric specifications")
      }
    } catch (error) {
      notify.error("Error", "Failed to save fabric specifications")
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof FabricMetadata, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const patternOptions = [
    { value: 'Solid', label: 'Solid' },
    { value: 'Stripe', label: 'Stripe' },
    { value: 'Plaid', label: 'Plaid' },
    { value: 'Floral', label: 'Floral' },
    { value: 'Geometric', label: 'Geometric' },
    { value: 'Abstract', label: 'Abstract' },
    { value: 'Herringbone', label: 'Herringbone' },
    { value: 'Damask', label: 'Damask' },
    { value: 'Paisley', label: 'Paisley' },
    { value: 'Textured', label: 'Textured' }
  ]

  const usageOptions = [
    { value: 'Indoor', label: 'Indoor' },
    { value: 'Outdoor', label: 'Outdoor' },
    { value: 'Both', label: 'Indoor/Outdoor' }
  ]

  const gradeOptions = [
    { value: 'Residential', label: 'Residential' },
    { value: 'Light Commercial', label: 'Light Commercial' },
    { value: 'Heavy Commercial', label: 'Heavy Commercial' },
    { value: 'Contract', label: 'Contract Grade' }
  ]

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Fabric Specifications</Heading>
        <Text className="text-ui-fg-subtle mt-1">
          Manage detailed fabric specifications and properties
        </Text>
      </div>

      <div className="px-6">
        <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="border-b">
            <Tabs.Trigger value="basic">Basic Info</Tabs.Trigger>
            <Tabs.Trigger value="physical">Physical Properties</Tabs.Trigger>
            <Tabs.Trigger value="performance">Performance</Tabs.Trigger>
            <Tabs.Trigger value="care">Care & Features</Tabs.Trigger>
            <Tabs.Trigger value="business">Business Info</Tabs.Trigger>
          </Tabs.List>

          {/* Basic Info Tab */}
          <Tabs.Content value="basic" className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={metadata.brand || ''}
                  onChange={(e) => updateField('brand', e.target.value)}
                  placeholder="Enter brand name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={metadata.category || ''}
                  onChange={(e) => updateField('category', e.target.value)}
                  placeholder="e.g., Upholstery, Drapery"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pattern">Pattern</Label>
                <Select
                  value={metadata.pattern || ''}
                  onValueChange={(value) => updateField('pattern', value)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select pattern" />
                  </Select.Trigger>
                  <Select.Content>
                    {patternOptions.map(option => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div>
                <Label htmlFor="style">Style</Label>
                <Input
                  id="style"
                  value={metadata.style || ''}
                  onChange={(e) => updateField('style', e.target.value)}
                  placeholder="e.g., Contemporary, Traditional"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="color">Primary Color</Label>
                <Input
                  id="color"
                  value={metadata.color || ''}
                  onChange={(e) => updateField('color', e.target.value)}
                  placeholder="e.g., Navy Blue"
                />
              </div>
              <div>
                <Label htmlFor="color_family">Color Family</Label>
                <Input
                  id="color_family"
                  value={metadata.color_family || ''}
                  onChange={(e) => updateField('color_family', e.target.value)}
                  placeholder="e.g., Blue"
                />
              </div>
              <div>
                <Label htmlFor="color_hex">Color Hex</Label>
                <div className="flex gap-2">
                  <Input
                    id="color_hex"
                    type="color"
                    value={metadata.color_hex || '#000000'}
                    onChange={(e) => updateField('color_hex', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={metadata.color_hex || ''}
                    onChange={(e) => updateField('color_hex', e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </Tabs.Content>

          {/* Physical Properties Tab */}
          <Tabs.Content value="physical" className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="composition">Material Composition</Label>
                <Input
                  id="composition"
                  value={metadata.composition || ''}
                  onChange={(e) => updateField('composition', e.target.value)}
                  placeholder="e.g., 100% Polyester"
                />
              </div>
              <div>
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  value={metadata.width || ''}
                  onChange={(e) => updateField('width', e.target.value)}
                  placeholder="e.g., 54 inches"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={metadata.weight || ''}
                  onChange={(e) => updateField('weight', e.target.value)}
                  placeholder="e.g., 12 oz per yard"
                />
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Select
                  value={metadata.grade || ''}
                  onValueChange={(value) => updateField('grade', value)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select grade" />
                  </Select.Trigger>
                  <Select.Content>
                    {gradeOptions.map(option => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="h_repeat">Horizontal Repeat</Label>
                <Input
                  id="h_repeat"
                  value={metadata.h_repeat || ''}
                  onChange={(e) => updateField('h_repeat', e.target.value)}
                  placeholder="e.g., 14 inches"
                />
              </div>
              <div>
                <Label htmlFor="v_repeat">Vertical Repeat</Label>
                <Input
                  id="v_repeat"
                  value={metadata.v_repeat || ''}
                  onChange={(e) => updateField('v_repeat', e.target.value)}
                  placeholder="e.g., 12 inches"
                />
              </div>
            </div>
          </Tabs.Content>

          {/* Performance Tab */}
          <Tabs.Content value="performance" className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usage">Usage</Label>
                <Select
                  value={metadata.usage || ''}
                  onValueChange={(value: 'Indoor' | 'Outdoor' | 'Both') => updateField('usage', value)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select usage" />
                  </Select.Trigger>
                  <Select.Content>
                    {usageOptions.map(option => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>
              <div>
                <Label htmlFor="durability">Durability Rating</Label>
                <Input
                  id="durability"
                  value={metadata.durability || ''}
                  onChange={(e) => updateField('durability', e.target.value)}
                  placeholder="e.g., Heavy Duty - 50,000 double rubs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="martindale">Martindale Rating</Label>
                <Input
                  id="martindale"
                  type="number"
                  value={metadata.martindale || ''}
                  onChange={(e) => updateField('martindale', parseInt(e.target.value))}
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <Label htmlFor="types">Application Types</Label>
                <Input
                  id="types"
                  value={metadata.types || ''}
                  onChange={(e) => updateField('types', e.target.value)}
                  placeholder="e.g., Upholstery, Curtains, Pillows"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="performance_metrics">Performance Metrics</Label>
              <Input
                id="performance_metrics"
                value={metadata.performance_metrics || ''}
                onChange={(e) => updateField('performance_metrics', e.target.value)}
                placeholder="Additional performance specifications"
              />
            </div>
          </Tabs.Content>

          {/* Care & Features Tab */}
          <Tabs.Content value="care" className="py-4 space-y-4">
            <div>
              <Label htmlFor="care_instructions">Care Instructions</Label>
              <textarea
                id="care_instructions"
                className="w-full p-2 border rounded-md"
                rows={3}
                value={metadata.care_instructions || ''}
                onChange={(e) => updateField('care_instructions', e.target.value)}
                placeholder="Enter detailed care instructions"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cleaning_code">Cleaning Code</Label>
                <Input
                  id="cleaning_code"
                  value={metadata.cleaning_code || ''}
                  onChange={(e) => updateField('cleaning_code', e.target.value)}
                  placeholder="e.g., W, S, WS"
                />
              </div>
              <div>
                <Label htmlFor="swatch_size">Swatch Size</Label>
                <Input
                  id="swatch_size"
                  value={metadata.swatch_size || ''}
                  onChange={(e) => updateField('swatch_size', e.target.value)}
                  placeholder="e.g., 4x4 inches"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Special Features</Label>
              <div className="grid grid-cols-2 gap-3">
                <Checkbox
                  id="washable"
                  checked={metadata.washable || false}
                  onCheckedChange={(checked) => updateField('washable', checked)}
                >
                  Machine Washable
                </Checkbox>
                <Checkbox
                  id="bleach_cleanable"
                  checked={metadata.bleach_cleanable || false}
                  onCheckedChange={(checked) => updateField('bleach_cleanable', checked)}
                >
                  Bleach Safe
                </Checkbox>
                <Checkbox
                  id="stain_resistant"
                  checked={metadata.stain_resistant || false}
                  onCheckedChange={(checked) => updateField('stain_resistant', checked)}
                >
                  Stain Resistant
                </Checkbox>
                <Checkbox
                  id="fade_resistant"
                  checked={metadata.fade_resistant || false}
                  onCheckedChange={(checked) => updateField('fade_resistant', checked)}
                >
                  Fade Resistant
                </Checkbox>
                <Checkbox
                  id="ca_117"
                  checked={metadata.ca_117 || false}
                  onCheckedChange={(checked) => updateField('ca_117', checked)}
                >
                  CA 117 Compliant
                </Checkbox>
                <Checkbox
                  id="quick_ship"
                  checked={metadata.quick_ship || false}
                  onCheckedChange={(checked) => updateField('quick_ship', checked)}
                >
                  Quick Ship Available
                </Checkbox>
                <Checkbox
                  id="closeout"
                  checked={metadata.closeout || false}
                  onCheckedChange={(checked) => updateField('closeout', checked)}
                >
                  Closeout Item
                </Checkbox>
                <Checkbox
                  id="is_featured"
                  checked={metadata.is_featured || false}
                  onCheckedChange={(checked) => updateField('is_featured', checked)}
                >
                  Featured Product
                </Checkbox>
              </div>
            </div>
          </Tabs.Content>

          {/* Business Info Tab */}
          <Tabs.Content value="business" className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier_name">Supplier Name</Label>
                <Input
                  id="supplier_name"
                  value={metadata.supplier_name || ''}
                  onChange={(e) => updateField('supplier_name', e.target.value)}
                  placeholder="Enter supplier name"
                />
              </div>
              <div>
                <Label htmlFor="availability">Availability Status</Label>
                <Input
                  id="availability"
                  value={metadata.availability || ''}
                  onChange={(e) => updateField('availability', e.target.value)}
                  placeholder="e.g., In Stock, Made to Order"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stock_unit">Stock Unit</Label>
                <Select
                  value={metadata.stock_unit || 'yard'}
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
              <div>
                <Label htmlFor="minimum_order_yards">Minimum Order</Label>
                <Input
                  id="minimum_order_yards"
                  value={metadata.minimum_order_yards || ''}
                  onChange={(e) => updateField('minimum_order_yards', e.target.value)}
                  placeholder="e.g., 1"
                />
              </div>
              <div>
                <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  value={metadata.low_stock_threshold || ''}
                  onChange={(e) => updateField('low_stock_threshold', parseInt(e.target.value))}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="procurement_cost">Procurement Cost</Label>
                <Input
                  id="procurement_cost"
                  type="number"
                  step="0.01"
                  value={metadata.procurement_cost || ''}
                  onChange={(e) => updateField('procurement_cost', parseFloat(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="swatch_price">Swatch Price</Label>
                <Input
                  id="swatch_price"
                  type="number"
                  step="0.01"
                  value={metadata.swatch_price || ''}
                  onChange={(e) => updateField('swatch_price', parseFloat(e.target.value))}
                  placeholder="5.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="technical_documents">Technical Documents URL</Label>
                <Input
                  id="technical_documents"
                  value={metadata.technical_documents || ''}
                  onChange={(e) => updateField('technical_documents', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="cleaning_pdf">Cleaning Guide PDF URL</Label>
                <Input
                  id="cleaning_pdf"
                  value={metadata.cleaning_pdf || ''}
                  onChange={(e) => updateField('cleaning_pdf', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="keywords">SEO Keywords</Label>
              <Input
                id="keywords"
                value={metadata.keywords || ''}
                onChange={(e) => updateField('keywords', e.target.value)}
                placeholder="Comma-separated keywords"
              />
            </div>
          </Tabs.Content>
        </Tabs>
      </div>

      <div className="px-6 py-4 flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => setMetadata(product.metadata as FabricMetadata || {})}
          disabled={isSaving}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Fabric Specifications'}
        </Button>
      </div>
    </Container>
  )
}

// Widget configuration
export const config: WidgetConfig = {
  zone: "product.details.after",
}

export default ProductFabricWidget