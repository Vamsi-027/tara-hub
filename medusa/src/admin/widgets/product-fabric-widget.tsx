import React, { useState, useEffect } from "react"
import { 
  Container, 
  Heading, 
  Text, 
  Input, 
  Label,
  Button,
  Tabs
} from "@medusajs/ui"
import { ProductDetailsWidgetProps, WidgetConfig } from "@medusajs/admin-sdk"

interface FabricMetadata {
  category?: string
  collection?: string
  brand?: string
  composition?: string
  width?: string
  // Add other fields as needed...
}

const ProductFabricWidget = ({ product, notify }: ProductDetailsWidgetProps) => {
  const [metadata, setMetadata] = useState<FabricMetadata>({})
  const [activeTab, setActiveTab] = useState("basic")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (product?.metadata) {
      setMetadata(product.metadata as FabricMetadata)
    }
  }, [product])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata })
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
    setMetadata(prev => ({ ...prev, [field]: value }))
  }

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
            <Tabs.Trigger value="physical">Physical</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="basic" className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={metadata.brand || ""}
                  onChange={(e) => updateField("brand", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={metadata.category || ""}
                  onChange={(e) => updateField("category", e.target.value)}
                />
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="physical" className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="composition">Composition</Label>
                <Input
                  id="composition"
                  value={metadata.composition || ""}
                  onChange={(e) => updateField("composition", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  value={metadata.width || ""}
                  onChange={(e) => updateField("width", e.target.value)}
                />
              </div>
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
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Fabric Specifications"}
        </Button>
      </div>
    </Container>
  )
}

export const config: WidgetConfig = {
  zone: "product.details.after",
}

export default ProductFabricWidget