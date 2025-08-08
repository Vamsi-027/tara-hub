"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { Fabric } from "@/lib/types"

interface FabricModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (fabric: Partial<Fabric>) => void
  fabric?: Fabric | null
  mode: "create" | "edit"
}

const categories = ["Upholstery", "Drapery", "Multi-Purpose", "Outdoor", "Leather", "Trim"]
const colors = ["Red", "Blue", "Green", "Yellow", "Gray", "Beige", "White", "Black", "Brown", "Multi"]

export function FabricModal({ isOpen, onClose, onSave, fabric, mode }: FabricModalProps) {
  const [formData, setFormData] = useState<Partial<Fabric>>({
    name: "",
    category: "Upholstery",
    color: "Gray",
    composition: "",
    width: "54",
    pricePerYard: 0,
    description: "",
    inStock: true,
    leadTime: "2-3 weeks",
    minimumOrder: 1,
    collection: "",
    pattern: "",
    durability: "",
    cleaningCode: "W",
    fireRating: "",
    image: "/fabric-placeholder.jpg"
  })

  useEffect(() => {
    if (fabric && mode === "edit") {
      setFormData(fabric)
    } else if (mode === "create") {
      setFormData({
        name: "",
        category: "Upholstery",
        color: "Gray",
        composition: "",
        width: "54",
        pricePerYard: 0,
        description: "",
        inStock: true,
        leadTime: "2-3 weeks",
        minimumOrder: 1,
        collection: "",
        pattern: "",
        durability: "",
        cleaningCode: "W",
        fireRating: "",
        image: "/fabric-placeholder.jpg"
      })
    }
  }, [fabric, mode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name || !formData.composition || !formData.description) {
      alert("Please fill in all required fields: Name, Composition, and Description")
      return
    }
    
    onSave(formData)
    onClose()
  }

  const handleChange = (field: keyof Fabric, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Fabric" : "Edit Fabric"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Fabric name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select value={formData.color} onValueChange={(value) => handleChange("color", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colors.map(col => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pricePerYard">Price per Yard ($) *</Label>
              <Input
                id="pricePerYard"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerYard}
                onChange={(e) => handleChange("pricePerYard", parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="width">Width (inches)</Label>
              <Input
                id="width"
                value={formData.width}
                onChange={(e) => handleChange("width", e.target.value)}
                placeholder="54"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimumOrder">Minimum Order (yards)</Label>
              <Input
                id="minimumOrder"
                type="number"
                min="1"
                value={formData.minimumOrder}
                onChange={(e) => handleChange("minimumOrder", parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="composition">Composition *</Label>
            <Input
              id="composition"
              value={formData.composition}
              onChange={(e) => handleChange("composition", e.target.value)}
              placeholder="e.g., 100% Cotton, 80% Polyester 20% Linen"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe the fabric's characteristics, uses, and special features..."
              rows={3}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="collection">Collection</Label>
              <Input
                id="collection"
                value={formData.collection}
                onChange={(e) => handleChange("collection", e.target.value)}
                placeholder="Collection name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pattern">Pattern</Label>
              <Input
                id="pattern"
                value={formData.pattern}
                onChange={(e) => handleChange("pattern", e.target.value)}
                placeholder="e.g., Solid, Stripe, Floral"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="durability">Durability Rating</Label>
              <Input
                id="durability"
                value={formData.durability}
                onChange={(e) => handleChange("durability", e.target.value)}
                placeholder="e.g., 50,000 Double Rubs"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cleaningCode">Cleaning Code</Label>
              <Select value={formData.cleaningCode} onValueChange={(value) => handleChange("cleaningCode", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="W">W - Water Based</SelectItem>
                  <SelectItem value="S">S - Solvent</SelectItem>
                  <SelectItem value="WS">WS - Water or Solvent</SelectItem>
                  <SelectItem value="X">X - Professional Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="leadTime">Lead Time</Label>
              <Input
                id="leadTime"
                value={formData.leadTime}
                onChange={(e) => handleChange("leadTime", e.target.value)}
                placeholder="e.g., 2-3 weeks"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fireRating">Fire Rating</Label>
              <Input
                id="fireRating"
                value={formData.fireRating}
                onChange={(e) => handleChange("fireRating", e.target.value)}
                placeholder="e.g., NFPA 701"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="inStock"
              checked={formData.inStock}
              onCheckedChange={(checked) => handleChange("inStock", checked)}
            />
            <Label htmlFor="inStock">In Stock</Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === "create" ? "Add Fabric" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}