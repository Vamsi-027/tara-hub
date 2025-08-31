import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { 
  Container, 
  Heading, 
  Text, 
  Input, 
  Select, 
  Switch,
  Label,
  Button,
  Tabs,
  Badge,
  IconButton,
  Textarea
} from "@medusajs/ui"
import { 
  DetailedProductDTO,
  AdminProduct
} from "@medusajs/framework/types"
import { useState, useEffect } from "react"
import { PencilSquare, XMarkMini, Plus } from "@medusajs/icons"

interface FabricWidgetProps {
  data: DetailedProductDTO
}

const FabricMetadataWidget = ({ data }: FabricWidgetProps) => {
  const product = data
  const [isEditing, setIsEditing] = useState(false)
  const [metadata, setMetadata] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState("basic")
  const [isSaving, setIsSaving] = useState(false)
  const [properties, setProperties] = useState<string[]>([])
  const [newProperty, setNewProperty] = useState("")

  useEffect(() => {
    if (product?.metadata) {
      setMetadata(product.metadata)
      setProperties(product.metadata.properties || [])
    }
  }, [product])

  const updateField = (field: string, value: any) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addProperty = () => {
    if (newProperty.trim()) {
      const updated = [...properties, newProperty.trim()]
      setProperties(updated)
      updateField('properties', updated)
      setNewProperty("")
    }
  }

  const removeProperty = (index: number) => {
    const updated = properties.filter((_, i) => i !== index)
    setProperties(updated)
    updateField('properties', updated)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/admin/products/${product.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            ...metadata,
            properties
          }
        })
      })

      if (response.ok) {
        setIsEditing(false)
        // Show success notification
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const patternOptions = [
    'Solid', 'Stripe', 'Plaid', 'Floral', 'Geometric', 
    'Abstract', 'Herringbone', 'Damask', 'Paisley', 'Textured'
  ]

  const usageOptions = ['Indoor', 'Outdoor', 'Both']
  const gradeOptions = ['Residential', 'Light Commercial', 'Heavy Commercial', 'Contract']

  if (!isEditing) {
    return (
      <Container className="divide-y">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">Fabric Specifications</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Detailed fabric properties and specifications
            </Text>
          </div>
          <Button 
            variant="secondary" 
            size="small"
            onClick={() => setIsEditing(true)}
          >
            <PencilSquare className="mr-2" />
            Edit Specifications
          </Button>
        </div>
        
        {metadata && Object.keys(metadata).length > 0 ? (
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {metadata.brand && (
                <div>
                  <Text className="text-ui-fg-subtle text-sm">Brand</Text>
                  <Text className="font-medium">{metadata.brand}</Text>
                </div>
              )}
              {metadata.category && (
                <div>
                  <Text className="text-ui-fg-subtle text-sm">Category</Text>
                  <Text className="font-medium">{metadata.category}</Text>
                </div>
              )}
              {metadata.pattern && (
                <div>
                  <Text className="text-ui-fg-subtle text-sm">Pattern</Text>
                  <Text className="font-medium">{metadata.pattern}</Text>
                </div>
              )}
              {metadata.color && (
                <div>
                  <Text className="text-ui-fg-subtle text-sm">Color</Text>
                  <div className="flex items-center gap-2">
                    {metadata.color_hex && (
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: metadata.color_hex }}
                      />
                    )}
                    <Text className="font-medium">{metadata.color}</Text>
                  </div>
                </div>
              )}
              {metadata.composition && (
                <div>
                  <Text className="text-ui-fg-subtle text-sm">Composition</Text>
                  <Text className="font-medium">{metadata.composition}</Text>
                </div>
              )}
              {metadata.width && (
                <div>
                  <Text className="text-ui-fg-subtle text-sm">Width</Text>
                  <Text className="font-medium">{metadata.width}</Text>
                </div>
              )}
              {metadata.weight && (
                <div>
                  <Text className="text-ui-fg-subtle text-sm">Weight</Text>
                  <Text className="font-medium">{metadata.weight}</Text>
                </div>
              )}
              {metadata.usage && (
                <div>
                  <Text className="text-ui-fg-subtle text-sm">Usage</Text>
                  <Text className="font-medium">{metadata.usage}</Text>
                </div>
              )}
              {metadata.durability && (
                <div>
                  <Text className="text-ui-fg-subtle text-sm">Durability</Text>
                  <Text className="font-medium">{metadata.durability}</Text>
                </div>
              )}
            </div>

            {properties.length > 0 && (
              <div>
                <Text className="text-ui-fg-subtle text-sm mb-2">Features</Text>
                <div className="flex flex-wrap gap-2">
                  {properties.map((prop, index) => (
                    <Badge key={index} size="small">{prop}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <Text className="text-ui-fg-subtle">
              No fabric specifications added yet
            </Text>
          </div>
        )}
      </Container>
    )
  }

  return (
    <Container className="divide-y">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Edit Fabric Specifications</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Update fabric properties and specifications
          </Text>
        </div>
      </div>

      <div className="px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="basic">Basic Info</Tabs.Trigger>
            <Tabs.Trigger value="physical">Physical</Tabs.Trigger>
            <Tabs.Trigger value="performance">Performance</Tabs.Trigger>
            <Tabs.Trigger value="features">Features</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="basic" className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input
                  value={metadata.brand || ''}
                  onChange={(e) => updateField('brand', e.target.value)}
                  placeholder="Brand name"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={metadata.category || ''}
                  onChange={(e) => updateField('category', e.target.value)}
                  placeholder="e.g., Upholstery"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pattern</Label>
                <Select
                  value={metadata.pattern || ''}
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
                <Label>Collection</Label>
                <Input
                  value={metadata.collection || ''}
                  onChange={(e) => updateField('collection', e.target.value)}
                  placeholder="Collection name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={metadata.color || ''}
                  onChange={(e) => updateField('color', e.target.value)}
                  placeholder="e.g., Navy Blue"
                />
              </div>
              <div className="space-y-2">
                <Label>Color Family</Label>
                <Input
                  value={metadata.color_family || ''}
                  onChange={(e) => updateField('color_family', e.target.value)}
                  placeholder="e.g., Blue"
                />
              </div>
              <div className="space-y-2">
                <Label>Color Hex</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={metadata.color_hex || '#000000'}
                    onChange={(e) => updateField('color_hex', e.target.value)}
                    className="w-12 h-9 rounded border cursor-pointer"
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

          <Tabs.Content value="physical" className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Composition</Label>
                <Input
                  value={metadata.composition || ''}
                  onChange={(e) => updateField('composition', e.target.value)}
                  placeholder="e.g., 100% Polyester"
                />
              </div>
              <div className="space-y-2">
                <Label>Width</Label>
                <Input
                  value={metadata.width || ''}
                  onChange={(e) => updateField('width', e.target.value)}
                  placeholder="e.g., 54 inches"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight</Label>
                <Input
                  value={metadata.weight || ''}
                  onChange={(e) => updateField('weight', e.target.value)}
                  placeholder="e.g., 12 oz"
                />
              </div>
              <div className="space-y-2">
                <Label>Grade</Label>
                <Select
                  value={metadata.grade || ''}
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

            <div className="space-y-2">
              <Label>Swatch Size</Label>
              <Input
                value={metadata.swatch_size || ''}
                onChange={(e) => updateField('swatch_size', e.target.value)}
                placeholder="e.g., 4x4 inches"
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Order Quantity</Label>
              <Input
                value={metadata.minimum_order_yards || ''}
                onChange={(e) => updateField('minimum_order_yards', e.target.value)}
                placeholder="e.g., 1 yard"
              />
            </div>
          </Tabs.Content>

          <Tabs.Content value="performance" className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Usage</Label>
                <Select
                  value={metadata.usage || ''}
                  onValueChange={(value) => updateField('usage', value)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Select usage" />
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
              <div className="space-y-2">
                <Label>Durability</Label>
                <Input
                  value={metadata.durability || ''}
                  onChange={(e) => updateField('durability', e.target.value)}
                  placeholder="e.g., 50,000 double rubs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Care Instructions</Label>
              <Textarea
                value={metadata.care_instructions || ''}
                onChange={(e) => updateField('care_instructions', e.target.value)}
                placeholder="Enter care instructions"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cleaning Code</Label>
                <Input
                  value={metadata.cleaning_code || ''}
                  onChange={(e) => updateField('cleaning_code', e.target.value)}
                  placeholder="e.g., W, S, WS"
                />
              </div>
              <div className="space-y-2">
                <Label>Martindale Rating</Label>
                <Input
                  type="number"
                  value={metadata.martindale || ''}
                  onChange={(e) => updateField('martindale', e.target.value)}
                  placeholder="e.g., 50000"
                />
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="features" className="py-4 space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Stain Resistant</Label>
                  <Switch
                    checked={metadata.stain_resistant || false}
                    onCheckedChange={(checked) => updateField('stain_resistant', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Fade Resistant</Label>
                  <Switch
                    checked={metadata.fade_resistant || false}
                    onCheckedChange={(checked) => updateField('fade_resistant', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Machine Washable</Label>
                  <Switch
                    checked={metadata.washable || false}
                    onCheckedChange={(checked) => updateField('washable', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Bleach Safe</Label>
                  <Switch
                    checked={metadata.bleach_cleanable || false}
                    onCheckedChange={(checked) => updateField('bleach_cleanable', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Quick Ship</Label>
                  <Switch
                    checked={metadata.quick_ship || false}
                    onCheckedChange={(checked) => updateField('quick_ship', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Featured Product</Label>
                  <Switch
                    checked={metadata.is_featured || false}
                    onCheckedChange={(checked) => updateField('is_featured', checked)}
                  />
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
                  >
                    <Plus />
                  </Button>
                </div>
                {properties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {properties.map((prop, index) => (
                      <Badge key={index} size="small" className="flex items-center gap-1">
                        {prop}
                        <button
                          onClick={() => removeProperty(index)}
                          className="ml-1 hover:text-red-500"
                        >
                          <XMarkMini className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Tabs.Content>
        </Tabs>
      </div>

      <div className="px-6 py-4 flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setIsEditing(false)
            setMetadata(product.metadata || {})
            setProperties(product.metadata?.properties || [])
          }}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Specifications'}
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default FabricMetadataWidget