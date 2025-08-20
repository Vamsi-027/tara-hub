"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X } from 'lucide-react'
import type { DBFabric } from "@/core/database/schemas"

interface FabricFormProps {
  fabric?: DBFabric
  onSubmit: (fabric: Omit<DBFabric, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
}

export function FabricForm({ fabric, onSubmit, onCancel }: FabricFormProps) {
  const [formData, setFormData] = useState({
    name: fabric?.name || "",
    sku: fabric?.sku || "",
    description: fabric?.description || "",
    type: fabric?.type || "Upholstery" as const,
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
    durability: fabric?.durability || 5,
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
    warranty_info: fabric?.warranty_info || "",
  })

  const [newTag, setNewTag] = useState("")
  const [newCareInstruction, setNewCareInstruction] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      images: fabric?.images || {
        thumbnail: formData.swatchImageUrl,
        main: formData.swatchImageUrl,
        detail: [formData.swatchImageUrl],
        room: [formData.swatchImageUrl]
      }
    })
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addCareInstruction = () => {
    if (newCareInstruction.trim() && !formData.careInstructions.includes(newCareInstruction.trim())) {
      setFormData(prev => ({
        ...prev,
        careInstructions: [...prev.careInstructions, newCareInstruction.trim()]
      }))
      setNewCareInstruction("")
    }
  }

  const removeCareInstruction = (instructionToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      careInstructions: prev.careInstructions.filter(instruction => instruction !== instructionToRemove)
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Identification */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        {/* Fabric Classification */}
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value: "Upholstery" | "Drapery" | "Both") => 
            setFormData(prev => ({ ...prev, type: value }))}>
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

        <div className="space-y-2">
          <Label htmlFor="pattern">Pattern *</Label>
          <Input
            id="pattern"
            value={formData.pattern}
            onChange={(e) => setFormData(prev => ({ ...prev, pattern: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Color *</Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="colorHex">Color Hex</Label>
          <Input
            id="colorHex"
            type="color"
            value={formData.colorHex}
            onChange={(e) => setFormData(prev => ({ ...prev, colorHex: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer *</Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="collection">Collection</Label>
          <Input
            id="collection"
            value={formData.collection}
            onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value }))}
          />
        </div>

        {/* Pricing & Ordering */}
        <div className="space-y-2">
          <Label htmlFor="pricePerYard">Price Per Yard *</Label>
          <Input
            id="pricePerYard"
            type="number"
            step="0.01"
            value={formData.pricePerYard}
            onChange={(e) => setFormData(prev => ({ ...prev, pricePerYard: parseFloat(e.target.value) || 0 }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="width">Width (inches)</Label>
          <Input
            id="width"
            type="number"
            value={formData.width}
            onChange={(e) => setFormData(prev => ({ ...prev, width: parseInt(e.target.value) || 54 }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minimumOrder">Minimum Order</Label>
          <Input
            id="minimumOrder"
            type="number"
            value={formData.minimumOrder}
            onChange={(e) => setFormData(prev => ({ ...prev, minimumOrder: parseInt(e.target.value) || 1 }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="leadTime">Lead Time (days)</Label>
          <Input
            id="leadTime"
            type="number"
            value={formData.leadTime}
            onChange={(e) => setFormData(prev => ({ ...prev, leadTime: parseInt(e.target.value) || 14 }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Stock Quantity</Label>
          <Input
            id="stockQuantity"
            type="number"
            value={formData.stockQuantity}
            onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
          />
        </div>

        {/* Physical Properties */}
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Input
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="e.g., 100% Cotton"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (oz/sq yd)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="durability">Durability (1-10) *</Label>
          <Input
            id="durability"
            type="number"
            min="1"
            max="10"
            value={formData.durability}
            onChange={(e) => setFormData(prev => ({ ...prev, durability: parseInt(e.target.value) || 5 }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="martindale">Martindale Rating</Label>
          <Input
            id="martindale"
            type="number"
            value={formData.martindale}
            onChange={(e) => setFormData(prev => ({ ...prev, martindale: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      {/* Treatment Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Treatment Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { key: 'isStainResistant', label: 'Stain Resistant' },
            { key: 'isFadeResistant', label: 'Fade Resistant' },
            { key: 'isWaterResistant', label: 'Water Resistant' },
            { key: 'isPetFriendly', label: 'Pet Friendly' },
            { key: 'isOutdoorSafe', label: 'Outdoor Safe' },
            { key: 'isFireRetardant', label: 'Fire Retardant' },
            { key: 'isCustomOrder', label: 'Custom Order' },
            { key: 'isActive', label: 'Active' },
            { key: 'isFeatured', label: 'Featured' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={formData[key as keyof typeof formData] as boolean}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, [key]: checked }))
                }
              />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Care Instructions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Care Instructions</h3>
        <div className="flex gap-2">
          <Input
            value={newCareInstruction}
            onChange={(e) => setNewCareInstruction(e.target.value)}
            placeholder="Add care instruction"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCareInstruction())}
          />
          <Button type="button" onClick={addCareInstruction}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.careInstructions.map((instruction, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {instruction}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeCareInstruction(instruction)}
              />
            </Badge>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tags</h3>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
      </div>

      {/* Additional Fields */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="swatchImageUrl">Swatch Image URL</Label>
          <Input
            id="swatchImageUrl"
            value={formData.swatchImageUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, swatchImageUrl: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="warranty_info">Warranty Information</Label>
          <Textarea
            id="warranty_info"
            value={formData.warranty_info}
            onChange={(e) => setFormData(prev => ({ ...prev, warranty_info: e.target.value }))}
            rows={2}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {fabric ? 'Update' : 'Create'} Fabric
        </Button>
      </div>
    </form>
  )
}
