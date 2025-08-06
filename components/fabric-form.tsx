"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Fabric } from "@/lib/fabric-seed-data"

interface FabricFormProps {
  fabric?: Fabric | null
  onSubmit: (data: Partial<Fabric>) => void
  onCancel: () => void
}

export function FabricForm({ fabric, onSubmit, onCancel }: FabricFormProps) {
  const [formData, setFormData] = useState<Partial<Fabric>>({
    name: fabric?.name || "",
    sku: fabric?.sku || "",
    description: fabric?.description || "",
    type: fabric?.type || "Upholstery",
    pattern: fabric?.pattern || "",
    color: fabric?.color || "",
    colorHex: fabric?.colorHex || "",
    manufacturer: fabric?.manufacturer || "",
    collection: fabric?.collection || "",
    pricePerYard: fabric?.pricePerYard || 0,
    width: fabric?.width || 54,
    minimumOrder: fabric?.minimumOrder || 1,
    leadTime: fabric?.leadTime || 14,
    stockQuantity: fabric?.stockQuantity || 0,
    isCustomOrder: fabric?.isCustomOrder || false,
    content: fabric?.content || "",
    weight: fabric?.weight || 0,
    durability: fabric?.durability || "",
    martindale: fabric?.martindale || 0,
    isStainResistant: fabric?.isStainResistant || false,
    isFadeResistant: fabric?.isFadeResistant || false,
    isWaterResistant: fabric?.isWaterResistant || false,
    isPetFriendly: fabric?.isPetFriendly || false,
    isOutdoorSafe: fabric?.isOutdoorSafe || false,
    isFireRetardant: fabric?.isFireRetardant || false,
    careInstructions: fabric?.careInstructions || [],
    notes: fabric?.notes || "",
    swatchImageUrl: fabric?.swatchImageUrl || "",
    tags: fabric?.tags || [],
    isActive: fabric?.isActive ?? true,
    isFeatured: fabric?.isFeatured || false,
    warrantyInfo: fabric?.warrantyInfo || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (field: keyof Fabric, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upholstery">Upholstery</SelectItem>
                  <SelectItem value="Drapery">Drapery</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pattern">Pattern *</Label>
              <Input
                id="pattern"
                value={formData.pattern}
                onChange={(e) => handleInputChange("pattern", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="color">Color *</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleInputChange("color", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="colorHex">Color Hex</Label>
              <Input
                id="colorHex"
                type="color"
                value={formData.colorHex}
                onChange={(e) => handleInputChange("colorHex", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manufacturer & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => handleInputChange("manufacturer", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="collection">Collection</Label>
              <Input
                id="collection"
                value={formData.collection}
                onChange={(e) => handleInputChange("collection", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pricePerYard">Price per Yard *</Label>
              <Input
                id="pricePerYard"
                type="number"
                step="0.01"
                value={formData.pricePerYard}
                onChange={(e) => handleInputChange("pricePerYard", parseFloat(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="width">Width (inches)</Label>
              <Input
                id="width"
                type="number"
                value={formData.width}
                onChange={(e) => handleInputChange("width", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="minimumOrder">Minimum Order</Label>
              <Input
                id="minimumOrder"
                type="number"
                value={formData.minimumOrder}
                onChange={(e) => handleInputChange("minimumOrder", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="leadTime">Lead Time (days)</Label>
              <Input
                id="leadTime"
                type="number"
                value={formData.leadTime}
                onChange={(e) => handleInputChange("leadTime", parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleInputChange("stockQuantity", parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Physical Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content">Content</Label>
              <Input
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                placeholder="e.g., 100% Cotton"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (oz per sq yard)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", parseFloat(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="durability">Durability *</Label>
              <Input
                id="durability"
                value={formData.durability}
                onChange={(e) => handleInputChange("durability", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="martindale">Martindale (abrasion resistance)</Label>
              <Input
                id="martindale"
                type="number"
                value={formData.martindale}
                onChange={(e) => handleInputChange("martindale", parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Treatment Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isStainResistant"
                checked={formData.isStainResistant}
                onCheckedChange={(checked) => handleInputChange("isStainResistant", checked)}
              />
              <Label htmlFor="isStainResistant">Stain Resistant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFadeResistant"
                checked={formData.isFadeResistant}
                onCheckedChange={(checked) => handleInputChange("isFadeResistant", checked)}
              />
              <Label htmlFor="isFadeResistant">Fade Resistant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isWaterResistant"
                checked={formData.isWaterResistant}
                onCheckedChange={(checked) => handleInputChange("isWaterResistant", checked)}
              />
              <Label htmlFor="isWaterResistant">Water Resistant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPetFriendly"
                checked={formData.isPetFriendly}
                onCheckedChange={(checked) => handleInputChange("isPetFriendly", checked)}
              />
              <Label htmlFor="isPetFriendly">Pet Friendly</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOutdoorSafe"
                checked={formData.isOutdoorSafe}
                onCheckedChange={(checked) => handleInputChange("isOutdoorSafe", checked)}
              />
              <Label htmlFor="isOutdoorSafe">Outdoor Safe</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFireRetardant"
                checked={formData.isFireRetardant}
                onCheckedChange={(checked) => handleInputChange("isFireRetardant", checked)}
              />
              <Label htmlFor="isFireRetardant">Fire Retardant</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCustomOrder"
                checked={formData.isCustomOrder}
                onCheckedChange={(checked) => handleInputChange("isCustomOrder", checked)}
              />
              <Label htmlFor="isCustomOrder">Custom Order</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="careInstructions">Care Instructions (comma-separated)</Label>
            <Textarea
              id="careInstructions"
              value={formData.careInstructions?.join(", ")}
              onChange={(e) => handleInputChange("careInstructions", e.target.value.split(",").map(s => s.trim()))}
              placeholder="Professional cleaning recommended, Avoid direct sunlight"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="swatchImageUrl">Swatch Image URL</Label>
            <Input
              id="swatchImageUrl"
              value={formData.swatchImageUrl}
              onChange={(e) => handleInputChange("swatchImageUrl", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags?.join(", ")}
              onChange={(e) => handleInputChange("tags", e.target.value.split(",").map(s => s.trim()))}
              placeholder="luxury, velvet, green, upholstery"
            />
          </div>
          <div>
            <Label htmlFor="warrantyInfo">Warranty Information</Label>
            <Textarea
              id="warrantyInfo"
              value={formData.warrantyInfo}
              onChange={(e) => handleInputChange("warrantyInfo", e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => handleInputChange("isFeatured", checked)}
              />
              <Label htmlFor="isFeatured">Featured</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {fabric ? "Update Fabric" : "Add Fabric"}
        </Button>
      </div>
    </form>
  )
}
