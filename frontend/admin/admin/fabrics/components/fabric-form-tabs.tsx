import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TabsContent } from "@/components/ui/tabs"
import { 
  Plus, 
  X, 
  Info,
  Shield,
  Heart,
  Droplets,
  Flame,
  Bug,
  Sun,
  Home,
  FileText
} from "lucide-react"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FabricFormTabsProps {
  formData: any
  handleChange: (field: string, value: any) => void
  validationErrors: Record<string, string>
}

const environmentalRatings = [
  { value: 'A+', label: 'A+ - Excellent' },
  { value: 'A', label: 'A - Very Good' },
  { value: 'B', label: 'B - Good' },
  { value: 'C', label: 'C - Moderate' },
  { value: 'D', label: 'D - Poor' },
]

export function PerformanceTab({ formData, handleChange, validationErrors }: FabricFormTabsProps) {
  return (
    <TabsContent value="performance">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Performance Ratings
          </CardTitle>
          <CardDescription>
            Technical performance metrics and durability ratings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These ratings help customers understand fabric durability and performance characteristics.
            </AlertDescription>
          </Alert>

          {/* Abrasion Resistance */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="martindale">
                Martindale Rating (Rubs)
                <span className="text-xs text-muted-foreground ml-2">European Standard</span>
              </Label>
              <Input
                id="martindale"
                type="number"
                value={formData.martindale}
                onChange={(e) => handleChange('martindale', e.target.value)}
                placeholder="e.g., 40000"
              />
              <p className="text-xs text-muted-foreground">
                15,000+ domestic | 25,000+ commercial | 40,000+ heavy duty
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="wyzenbeek">
                Wyzenbeek Rating (Double Rubs)
                <span className="text-xs text-muted-foreground ml-2">US Standard</span>
              </Label>
              <Input
                id="wyzenbeek"
                type="number"
                value={formData.wyzenbeek}
                onChange={(e) => handleChange('wyzenbeek', e.target.value)}
                placeholder="e.g., 30000"
              />
              <p className="text-xs text-muted-foreground">
                15,000+ light | 30,000+ medium | 50,000+ heavy duty
              </p>
            </div>
          </div>

          {/* Light and Pilling Resistance */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="lightfastness">
                Lightfastness Rating (1-8 scale)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="lightfastness"
                  type="range"
                  min="1"
                  max="8"
                  value={formData.lightfastness || 4}
                  onChange={(e) => handleChange('lightfastness', e.target.value)}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold">
                  {formData.lightfastness || 4}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                1-3: Poor | 4-5: Moderate | 6-7: Good | 8: Excellent
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="pillingResistance">
                Pilling Resistance (1-5 scale)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pillingResistance"
                  type="range"
                  min="1"
                  max="5"
                  value={formData.pillingResistance || 3}
                  onChange={(e) => handleChange('pillingResistance', e.target.value)}
                  className="flex-1"
                />
                <span className="w-8 text-center font-bold">
                  {formData.pillingResistance || 3}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                1: Severe | 2-3: Moderate | 4-5: Minimal to none
              </p>
            </div>
          </div>

          {/* Thickness */}
          <div className="grid gap-2">
            <Label htmlFor="thickness">Thickness (mm)</Label>
            <Input
              id="thickness"
              type="number"
              step="0.1"
              value={formData.thickness}
              onChange={(e) => handleChange('thickness', e.target.value)}
              placeholder="e.g., 1.5"
            />
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}

export function CareAndTreatmentTab({ formData, handleChange }: FabricFormTabsProps) {
  const [newCareInstruction, setNewCareInstruction] = useState('')
  
  const addCareInstruction = () => {
    if (newCareInstruction.trim()) {
      const instructions = formData.careInstructions || []
      handleChange('careInstructions', [...instructions, newCareInstruction.trim()])
      setNewCareInstruction('')
    }
  }
  
  const removeCareInstruction = (index: number) => {
    const instructions = [...(formData.careInstructions || [])]
    instructions.splice(index, 1)
    handleChange('careInstructions', instructions)
  }

  return (
    <TabsContent value="care">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Care & Treatment Features
          </CardTitle>
          <CardDescription>
            Care instructions and special treatment features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Care Instructions */}
          <div className="grid gap-2">
            <Label>Care Instructions</Label>
            <div className="flex gap-2">
              <Input
                value={newCareInstruction}
                onChange={(e) => setNewCareInstruction(e.target.value)}
                placeholder="e.g., Machine wash cold, tumble dry low"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCareInstruction())}
              />
              <Button type="button" onClick={addCareInstruction} variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.careInstructions && formData.careInstructions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.careInstructions.map((instruction: string, index: number) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {instruction}
                    <button
                      type="button"
                      onClick={() => removeCareInstruction(index)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Treatment Features Grid */}
          <div className="space-y-4">
            <Label>Treatment Features</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <Label htmlFor="isStainResistant" className="cursor-pointer">
                    Stain Resistant
                  </Label>
                </div>
                <Switch
                  id="isStainResistant"
                  checked={formData.isStainResistant}
                  onCheckedChange={(checked) => handleChange('isStainResistant', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-yellow-500" />
                  <Label htmlFor="isFadeResistant" className="cursor-pointer">
                    Fade Resistant
                  </Label>
                </div>
                <Switch
                  id="isFadeResistant"
                  checked={formData.isFadeResistant}
                  onCheckedChange={(checked) => handleChange('isFadeResistant', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-500" />
                  <Label htmlFor="isWaterResistant" className="cursor-pointer">
                    Water Resistant
                  </Label>
                </div>
                <Switch
                  id="isWaterResistant"
                  checked={formData.isWaterResistant}
                  onCheckedChange={(checked) => handleChange('isWaterResistant', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <Label htmlFor="isPetFriendly" className="cursor-pointer">
                    Pet Friendly
                  </Label>
                </div>
                <Switch
                  id="isPetFriendly"
                  checked={formData.isPetFriendly}
                  onCheckedChange={(checked) => handleChange('isPetFriendly', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-green-500" />
                  <Label htmlFor="isOutdoorSafe" className="cursor-pointer">
                    Outdoor Safe
                  </Label>
                </div>
                <Switch
                  id="isOutdoorSafe"
                  checked={formData.isOutdoorSafe}
                  onCheckedChange={(checked) => handleChange('isOutdoorSafe', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <Label htmlFor="isFireRetardant" className="cursor-pointer">
                    Fire Retardant
                  </Label>
                </div>
                <Switch
                  id="isFireRetardant"
                  checked={formData.isFireRetardant}
                  onCheckedChange={(checked) => handleChange('isFireRetardant', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-purple-500" />
                  <Label htmlFor="isBleachCleanable" className="cursor-pointer">
                    Bleach Cleanable
                  </Label>
                </div>
                <Switch
                  id="isBleachCleanable"
                  checked={formData.isBleachCleanable}
                  onCheckedChange={(checked) => handleChange('isBleachCleanable', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-green-600" />
                  <Label htmlFor="isAntimicrobial" className="cursor-pointer">
                    Antimicrobial
                  </Label>
                </div>
                <Switch
                  id="isAntimicrobial"
                  checked={formData.isAntimicrobial}
                  onCheckedChange={(checked) => handleChange('isAntimicrobial', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}

export function TechnicalSpecsTab({ formData, handleChange }: FabricFormTabsProps) {
  const [newFiber, setNewFiber] = useState({ fiber: '', percentage: '' })
  
  const addFiberContent = () => {
    if (newFiber.fiber && newFiber.percentage) {
      const content = formData.fiberContent || []
      handleChange('fiberContent', [...content, { 
        fiber: newFiber.fiber, 
        percentage: parseInt(newFiber.percentage) 
      }])
      setNewFiber({ fiber: '', percentage: '' })
    }
  }
  
  const removeFiberContent = (index: number) => {
    const content = [...(formData.fiberContent || [])]
    content.splice(index, 1)
    handleChange('fiberContent', content)
  }

  return (
    <TabsContent value="technical">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Technical Specifications
          </CardTitle>
          <CardDescription>
            Detailed technical information and composition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fiber Content */}
          <div className="grid gap-2">
            <Label>Fiber Content</Label>
            <div className="flex gap-2">
              <Input
                value={newFiber.fiber}
                onChange={(e) => setNewFiber({ ...newFiber, fiber: e.target.value })}
                placeholder="Fiber type (e.g., Cotton)"
                className="flex-1"
              />
              <Input
                type="number"
                value={newFiber.percentage}
                onChange={(e) => setNewFiber({ ...newFiber, percentage: e.target.value })}
                placeholder="%"
                className="w-20"
                max="100"
              />
              <Button type="button" onClick={addFiberContent} variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.fiberContent && formData.fiberContent.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.fiberContent.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{item.fiber}: {item.percentage}%</span>
                    <button
                      type="button"
                      onClick={() => removeFiberContent(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="text-sm text-muted-foreground">
                  Total: {formData.fiberContent.reduce((sum: number, item: any) => sum + item.percentage, 0)}%
                </div>
              </div>
            )}
          </div>

          {/* Technical Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="backingType">Backing Type</Label>
              <Input
                id="backingType"
                value={formData.backingType}
                onChange={(e) => handleChange('backingType', e.target.value)}
                placeholder="e.g., Acrylic, Cotton, None"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="finishTreatment">Finish Treatment</Label>
              <Input
                id="finishTreatment"
                value={formData.finishTreatment}
                onChange={(e) => handleChange('finishTreatment', e.target.value)}
                placeholder="e.g., Scotchgard, Teflon, Crypton"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="countryOfOrigin">Country of Origin</Label>
              <Input
                id="countryOfOrigin"
                value={formData.countryOfOrigin}
                onChange={(e) => handleChange('countryOfOrigin', e.target.value)}
                placeholder="e.g., Italy, USA, India"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="flammabilityStandard">Flammability Standard</Label>
              <Input
                id="flammabilityStandard"
                value={formData.flammabilityStandard}
                onChange={(e) => handleChange('flammabilityStandard', e.target.value)}
                placeholder="e.g., NFPA 701, BS 5852, CA TB 117"
              />
            </div>
          </div>

          {/* Order Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="minimumOrder">Minimum Order Quantity</Label>
              <Input
                id="minimumOrder"
                type="number"
                step="0.5"
                value={formData.minimumOrder}
                onChange={(e) => handleChange('minimumOrder', e.target.value)}
                placeholder="1"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="incrementQuantity">Order Increment</Label>
              <Input
                id="incrementQuantity"
                type="number"
                step="0.5"
                value={formData.incrementQuantity}
                onChange={(e) => handleChange('incrementQuantity', e.target.value)}
                placeholder="1"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="leadTimeDays">Lead Time (Days)</Label>
              <Input
                id="leadTimeDays"
                type="number"
                value={formData.leadTimeDays}
                onChange={(e) => handleChange('leadTimeDays', e.target.value)}
                placeholder="e.g., 14"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="isCustomOrder" className="cursor-pointer">
                Custom Order Only
              </Label>
              <Switch
                id="isCustomOrder"
                checked={formData.isCustomOrder}
                onCheckedChange={(checked) => handleChange('isCustomOrder', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}

export function CertificationsTab({ formData, handleChange }: FabricFormTabsProps) {
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '' })
  
  const addCertification = () => {
    if (newCert.name && newCert.issuer) {
      const certs = formData.certifications || []
      handleChange('certifications', [...certs, newCert])
      setNewCert({ name: '', issuer: '', date: '' })
    }
  }
  
  const removeCertification = (index: number) => {
    const certs = [...(formData.certifications || [])]
    certs.splice(index, 1)
    handleChange('certifications', certs)
  }

  return (
    <TabsContent value="certifications">
      <Card>
        <CardHeader>
          <CardTitle>Certifications & Compliance</CardTitle>
          <CardDescription>
            Environmental ratings and industry certifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environmental Rating */}
          <div className="grid gap-2">
            <Label htmlFor="environmentalRating">Environmental Rating</Label>
            <Select
              value={formData.environmentalRating}
              onValueChange={(value) => handleChange('environmentalRating', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {environmentalRatings.map(rating => (
                  <SelectItem key={rating.value} value={rating.value}>
                    {rating.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Certifications */}
          <div className="grid gap-2">
            <Label>Certifications</Label>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                value={newCert.name}
                onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                placeholder="Certification name"
              />
              <Input
                value={newCert.issuer}
                onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                placeholder="Issuing body"
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={newCert.date}
                  onChange={(e) => setNewCert({ ...newCert, date: e.target.value })}
                />
                <Button type="button" onClick={addCertification} variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {formData.certifications && formData.certifications.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.certifications.map((cert: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{cert.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {cert.issuer} {cert.date && `• ${new Date(cert.date).toLocaleDateString()}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="publicNotes">Public Notes</Label>
              <Textarea
                id="publicNotes"
                value={formData.publicNotes}
                onChange={(e) => handleChange('publicNotes', e.target.value)}
                placeholder="Customer-visible notes about this fabric..."
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="warrantyInfo">Warranty Information</Label>
              <Textarea
                id="warrantyInfo"
                value={formData.warrantyInfo}
                onChange={(e) => handleChange('warrantyInfo', e.target.value)}
                placeholder="Warranty details and coverage..."
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="returnPolicy">Return Policy</Label>
              <Textarea
                id="returnPolicy"
                value={formData.returnPolicy}
                onChange={(e) => handleChange('returnPolicy', e.target.value)}
                placeholder="Specific return policy for this fabric..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}

export function UsageSuitabilityTab({ formData, handleChange }: FabricFormTabsProps) {
  const usageOptions = [
    { id: 'residential', label: 'Residential', icon: Home },
    { id: 'commercial', label: 'Commercial', icon: Shield },
    { id: 'hospitality', label: 'Hospitality', icon: Home },
    { id: 'healthcare', label: 'Healthcare', icon: Heart },
    { id: 'marine', label: 'Marine', icon: Droplets },
    { id: 'automotive', label: 'Automotive', icon: Shield },
    { id: 'aviation', label: 'Aviation', icon: Shield },
    { id: 'outdoor', label: 'Outdoor', icon: Sun },
  ]

  const applicationOptions = [
    { id: 'upholstery', label: 'Upholstery' },
    { id: 'drapery', label: 'Drapery' },
    { id: 'bedding', label: 'Bedding' },
    { id: 'wallcovering', label: 'Wall Covering' },
    { id: 'heavyTraffic', label: 'Heavy Traffic' },
    { id: 'lightTraffic', label: 'Light Traffic' },
  ]

  const updateSuitability = (key: string, value: boolean) => {
    const suitability = formData.usageSuitability || {}
    handleChange('usageSuitability', { ...suitability, [key]: value })
  }

  return (
    <TabsContent value="suitability">
      <Card>
        <CardHeader>
          <CardTitle>Usage & Suitability</CardTitle>
          <CardDescription>
            Recommended applications and usage scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage Environments */}
          <div>
            <Label className="mb-4 block">Suitable Environments</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {usageOptions.map(option => {
                const Icon = option.icon
                return (
                  <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={option.id} className="cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                    <Switch
                      id={option.id}
                      checked={formData.usageSuitability?.[option.id] || false}
                      onCheckedChange={(checked) => updateSuitability(option.id, checked)}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Applications */}
          <div>
            <Label className="mb-4 block">Suitable Applications</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {applicationOptions.map(option => (
                <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor={`app-${option.id}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                  <Switch
                    id={`app-${option.id}`}
                    checked={formData.usageSuitability?.[option.id] || false}
                    onCheckedChange={(checked) => updateSuitability(option.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Display Features */}
          <div>
            <Label className="mb-4 block">Display Features</Label>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="isNewArrival" className="cursor-pointer">
                  New Arrival
                </Label>
                <Switch
                  id="isNewArrival"
                  checked={formData.isNewArrival}
                  onCheckedChange={(checked) => handleChange('isNewArrival', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="isBestSeller" className="cursor-pointer">
                  Best Seller
                </Label>
                <Switch
                  id="isBestSeller"
                  checked={formData.isBestSeller}
                  onCheckedChange={(checked) => handleChange('isBestSeller', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="isFeatured" className="cursor-pointer">
                  Featured
                </Label>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleChange('isFeatured', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}