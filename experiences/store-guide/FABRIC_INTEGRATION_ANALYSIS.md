# Fabric Data Schema Comparison & Enhancement Report

## Current Admin App Fields (What's Available)

Based on the admin fabrics management screen (`/app/admin/fabrics/[id]/edit/page.tsx`), the following fields are currently available:

### Basic Information
- ✅ SKU
- ✅ Name  
- ✅ Description
- ✅ Type (Upholstery, Drapery, Multi-Purpose, Outdoor, Sheer, Blackout)
- ✅ Status (Active, Discontinued, Out of Stock, Coming Soon, Sale, Clearance)
- ✅ Active flag
- ✅ Featured flag

### Details
- ✅ Brand
- ✅ Collection
- ⚠️ Category (field exists but not used)
- ⚠️ Style (field exists but not used)
- ✅ Material
- ✅ Pattern
- ⚠️ Color Family (field exists but limited use)
- ✅ Colors (array)
- ✅ Width (inches)
- ✅ Weight (oz/yd²)

### Images
- ✅ Images array (multiple images supported)

### Procurement (Currently in Edit Form)
- ✅ Procurement Cost (mapped to 'cost' field)
- ✅ Supplier ID
- ✅ Supplier Name


### Inventory
- ✅ Stock Quantity
- ✅ Stock Unit (yards, meters, feet, rolls, pieces, hides)
- ✅ Low Stock Threshold

### SEO
- ✅ Meta Title
- ✅ Meta Description

## Full Database Schema Fields (What's Defined)

The complete schema in `lib/db/schema/fabrics.schema.ts` includes many additional fields:

### Missing Critical Fields for Store Experience

#### 🔴 Care & Maintenance (CRITICAL for customer experience)
- ❌ **Care Instructions** (jsonb field exists but not exposed)
- ❌ **Cleaning Code** (field exists but not exposed)
- ❌ **Maintenance Requirements**

#### 🔴 Performance & Durability (CRITICAL for fabric selection)
- ❌ **Durability Rating** (Light/Medium/Heavy/Extra Heavy Duty)
- ❌ **Martindale** (Abrasion resistance rating)
- ❌ **Wyzenbeek** (Alternative abrasion test)
- ❌ **Lightfastness** (1-8 scale)
- ❌ **Pilling Resistance** (1-5 scale)

#### 🔴 Treatment Features (CRITICAL for customer decisions)
- ❌ **Is Stain Resistant**
- ❌ **Is Fade Resistant**
- ❌ **Is Water Resistant**
- ❌ **Is Pet Friendly**
- ❌ **Is Outdoor Safe**
- ❌ **Is Fire Retardant**
- ❌ **Is Bleach Cleanable**
- ❌ **Is Antimicrobial**

#### 🟡 Composition & Technical Details
- ❌ **Fiber Content** (jsonb with fiber percentages)
- ❌ **Backing Type**
- ❌ **Finish Treatment**
- ❌ **Thickness**
- ❌ **Country of Origin**

#### 🟡 Certifications & Compliance
- ❌ **Certifications** (jsonb array)
- ❌ **Flammability Standard**
- ❌ **Environmental Rating**

#### 🟡 Additional Commerce Fields
- ❌ **Minimum Order Quantity**
- ❌ **Increment Quantity**
- ❌ **Lead Time Days**
- ❌ **Is Custom Order**
- ❌ **Warranty Info**
- ❌ **Return Policy**

#### 🟢 Nice-to-Have Fields
- ❌ **Designer Name**
- ❌ **Swatch Image URL** (separate from main images)
- ❌ **Texture Image URL**
- ❌ **Public Notes** (customer-facing notes)
- ❌ **Tags** (for search/filtering)

## Recommendations for Admin App Enhancement

### Phase 1: Critical Customer-Facing Fields (Immediate)

Add new tab "**Care & Performance**" to the edit form with:

```typescript
// Care Instructions Section
- careInstructions: string[] (multiline input or tag system)
- cleaningCode: select dropdown (W, S, WS, X, etc.)

// Performance Ratings Section  
- durabilityRating: select (Light/Medium/Heavy/Extra Heavy Duty)
- martindale: number input (0-100000)
- wyzenbeek: number input (0-100000)
- lightfastness: slider (1-8)
- pillingResistance: slider (1-5)

// Treatment Features Section (checkbox grid)
- isStainResistant: boolean
- isFadeResistant: boolean  
- isWaterResistant: boolean
- isPetFriendly: boolean
- isOutdoorSafe: boolean
- isFireRetardant: boolean
- isBleachCleanable: boolean
- isAntimicrobial: boolean
```

### Phase 2: Technical Details Tab

Add new tab "**Technical Specs**" with:

```typescript
// Composition
- fiberContent: Dynamic form for adding fiber percentages
  Example: Cotton 60%, Polyester 40%
- backingType: text input
- finishTreatment: text input
- thickness: number input (mm)

// Origin & Certification
- countryOfOrigin: country selector
- certifications: Dynamic form for adding certifications
- flammabilityStandard: text input
- environmentalRating: select dropdown
```

### Phase 3: Enhanced Commerce Features

Update existing tabs with:

```typescript
// In Inventory Tab
- minimumOrder: number input
- incrementQuantity: number input  
- leadTimeDays: number input
- isCustomOrder: boolean checkbox

// In Details Tab
- designerName: text input
- tags: tag input component
- publicNotes: textarea

// In Images Tab
- swatchImageUrl: separate upload for swatch
- textureImageUrl: separate upload for texture detail
```

## API Response Structure for Store Guide

The admin API should return comprehensive fabric data (EXCLUDING pricing/commerce):

```typescript
interface FabricAPIResponse {
  // Basic Info (currently available)
  id: string
  sku: string
  name: string
  description: string
  type: string
  
  // Visual & Brand (currently available)
  images: string[]
  brand: string
  collection: string
  colors: string[]
  pattern: string
  material: string
  width?: number
  weight?: number
  
  // MISSING BUT CRITICAL
  // Care & Maintenance
  careInstructions: string[]
  cleaningCode: string
  
  // Performance Ratings
  durabilityRating: string
  martindale?: number
  wyzenbeek?: number
  lightfastness?: number
  pillingResistance?: number
  
  // Treatment Features
  features: {
    stainResistant: boolean
    fadeResistant: boolean
    waterResistant: boolean
    petFriendly: boolean
    outdoorSafe: boolean
    fireRetardant: boolean
    bleachCleanable: boolean
    antimicrobial: boolean
  }
  
  // Composition
  fiberContent: Array<{
    fiber: string
    percentage: number
  }>
  backingType?: string
  finishTreatment?: string
  thickness?: number
  
  // Certifications
  certifications?: Array<{
    name: string
    issuer: string
    date: string
  }>
  environmentalRating?: string
  flammabilityStandard?: string
  
  // Display Features
  isFeatured: boolean
  isNewArrival: boolean
  isBestSeller: boolean
}
```

## Important Note: No Commerce Data

The store-guide experience should NOT display:
- ❌ Pricing (retail, wholesale, sale, cost)
- ❌ Inventory levels (stock quantity, availability)
- ❌ Minimum order quantities
- ❌ Lead times
- ❌ Supplier information
- ❌ Procurement costs

The focus should be entirely on fabric characteristics, care instructions, performance ratings, and features that help customers understand the fabric's suitability for their needs.
