# Fabric Product Types Implementation Guide

## Overview

This system supports 4 distinct types of fabric-based products in Medusa:
- **2 Configurable Types** (require custom module): User fabric selection
- **2 Fixed Types** (standard products): Pre-determined fabrics

## Product Types

### Type 1: Configurable Fabric Product
**User selects fabric during purchase**

#### Use Cases
- Custom curtains
- Made-to-order furniture
- Custom pillows
- Upholstery services

#### Features
- Customer browses fabric catalog
- Selects one fabric for the product
- Price calculated: Base product + Fabric price
- Fabric details stored with order

#### Implementation
- Uses `fabric-products` custom module
- Requires fabric selection workflow
- Stores selection in `order_fabric_selections` table

#### Example Flow
```
1. Customer selects "Custom Curtains" → Size: 52x84
2. System shows fabric selection UI
3. Customer browses and selects "Navy Linen"
4. Price: $180 (base) + $45/yard (fabric) = Total
5. Add to cart with fabric selection
```

#### Setup
```typescript
await fabricProductService.createConfigurableFabricProduct(productId, {
  category_filter: "Drapery",     // Only show certain fabrics
  collection_filter: "Premium",    // Further filtering
  base_price: 18000               // Base price in cents
})
```

---

### Type 2: Fixed Fabric Product
**Standard product made from specific fabric**

#### Use Cases
- Ready-made pillows
- Pre-designed curtains
- Fabric-specific products
- Stock items

#### Features
- Fabric is predetermined
- Customer selects size/color variants
- Standard inventory tracking
- No fabric selection UI

#### Implementation
- Standard Medusa product
- Uses `fabric-details` module to store fabric info
- No custom workflow needed

#### Example Flow
```
1. Customer views "Velvet Pillow - Emerald"
2. Selects size: 20x20
3. Selects insert: With Insert
4. Add to cart (fabric already determined)
```

#### Setup
```typescript
// Create standard product
const product = await createProduct({
  title: "Velvet Pillow - Emerald",
  metadata: {
    product_type: "fixed_fabric",
    fabric_sku: "VEL-EMR-001"
  }
})

// Add fabric details
await fabricDetailsService.create({
  product_id: product.id,
  composition: "100% Polyester Velvet",
  color: "Emerald",
  color_family: "Green"
})
```

---

### Type 3: Configurable Swatch Set
**User selects multiple fabrics (e.g., "Choose 5 for $10")**

#### Use Cases
- Fabric sample packs
- Color comparison sets
- Material testing sets
- Design consultation kits

#### Features
- Customer selects multiple fabrics
- Fixed set price
- Min/max selection limits
- All selections tracked

#### Implementation
- Uses `fabric-products` custom module
- Requires multi-selection workflow
- Stores selections in `order_fabric_selections` table

#### Example Flow
```
1. Customer selects "5 Swatch Set - $10"
2. System shows fabric catalog
3. Customer picks 5 different fabrics
4. All 5 selections saved with order
5. Fixed price regardless of fabric choices
```

#### Setup
```typescript
await fabricProductService.createConfigurableSwatchSetProduct(productId, {
  min_selections: 5,
  max_selections: 5,
  set_price: 1000,  // $10.00 fixed
  category_filter: "Upholstery"
})
```

---

### Type 4: Fixed Swatch Product
**Pre-selected fabric swatches as a set**

#### Use Cases
- Collection sample sets
- Seasonal fabric sets
- Designer curated sets
- Educational material sets

#### Features
- Predetermined fabric selection
- Fixed price
- No selection UI
- Can represent entire collections

#### Implementation
- Standard Medusa product
- Uses `fabric-details` module or metadata
- No custom workflow needed

#### Example Flow
```
1. Customer views "Cotton Collection Set - 12 Swatches"
2. Add to cart (all fabrics predetermined)
3. Receives all 12 cotton fabric swatches
```

#### Setup
```typescript
// Create standard product
const product = await createProduct({
  title: "Cotton Collection Set",
  metadata: {
    product_type: "fixed_swatch",
    included_fabrics: ["fabric-1", "fabric-2", ...],
    swatch_count: 12
  }
})

// Optionally add fabric details
await fabricDetailsService.create({
  product_id: product.id,
  collection: "Cotton Essentials",
  properties: {
    included_fabric_skus: ["COT-001", "COT-002", ...]
  }
})
```

## Architecture Summary

### Custom Module Required (Configurable Types)
**Types 1 & 3** need the `fabric-products` module because they:
- Require user selection during purchase
- Need validation of selections
- Must store selections with the order
- May have dynamic pricing based on selections

### Standard Products (Fixed Types)
**Types 2 & 4** use standard Medusa products because they:
- Have predetermined fabrics
- Don't require user selection
- Can use existing `fabric-details` module
- Follow standard e-commerce patterns

## Database Structure

### For Configurable Products (Types 1 & 3)

#### `product_fabric_config`
Stores configuration for products requiring selection:
- `product_id`: Links to Medusa product
- `fabric_type`: 'configurable_fabric' or 'configurable_swatch_set'
- `allow_fabric_selection`: Always true for these types
- `max_fabric_selections`: 1 for Type 1, N for Type 3
- `min_fabric_selections`: Minimum required selections

#### `order_fabric_selections`
Tracks customer fabric choices:
- `order_id`: Order reference
- `line_item_id`: Cart line item
- `fabric_id`: Selected fabric
- `fabric_metadata`: Snapshot of fabric details

#### `fabric_product_availability`
Controls which fabrics available per product:
- `product_id`: Product reference
- `fabric_id`: Fabric reference
- `price_adjustment`: Additional cost
- `is_available`: Availability flag

### For Fixed Products (Types 2 & 4)

Uses standard Medusa tables plus:
- `fabric_properties` table from fabric-details module
- Product `metadata` field for fabric references

## API Endpoints

### For Configurable Products

#### Get Available Fabrics
```http
GET /store/fabric-products/:productId/fabrics
```

#### Save Fabric Selection
```http
POST /store/fabric-products/select
```

### For Fixed Products
Use standard Medusa product APIs - no special endpoints needed.

## Frontend Integration

### Fabric Selector Component (Types 1 & 3 only)
```typescript
function FabricSelector({ product, onSelect }) {
  const [fabrics, setFabrics] = useState([])
  const [selected, setSelected] = useState([])
  
  useEffect(() => {
    // Only for configurable products
    if (product.metadata.product_type === 'configurable_fabric' || 
        product.metadata.product_type === 'configurable_swatch_set') {
      fetch(`/store/fabric-products/${product.id}/fabrics`)
        .then(res => res.json())
        .then(data => setFabrics(data.fabrics))
    }
  }, [product.id])
  
  // Render fabric selection UI
}
```

### Product Display Logic
```typescript
function ProductPage({ product }) {
  const requiresFabricSelection = 
    product.metadata.product_type === 'configurable_fabric' ||
    product.metadata.product_type === 'configurable_swatch_set'
  
  if (requiresFabricSelection) {
    return <ProductWithFabricSelection product={product} />
  } else {
    return <StandardProductDisplay product={product} />
  }
}
```

## Workflows

### Order Processing
- **Configurable Products**: Generate production instructions with fabric selections
- **Fixed Products**: Standard fulfillment process

### Price Calculation
- **Type 1**: Base price + Fabric price per yard
- **Type 2**: Fixed product price
- **Type 3**: Fixed set price
- **Type 4**: Fixed set price

## Testing

### Setup Test Products
```bash
npm run setup:fabric-products
```

This creates examples of all 4 types:
1. Custom Curtains (configurable fabric)
2. Velvet Pillow (fixed fabric)
3. Choose 5 Swatches (configurable set)
4. Cotton Collection (fixed set)

## Migration Strategy

### Converting Existing Products

To Type 1 (Configurable Fabric):
```typescript
await fabricProductService.createConfigurableFabricProduct(
  productId,
  { category_filter: "Upholstery" }
)
```

To Type 2 (Fixed Fabric):
```typescript
// Just add fabric details
await fabricDetailsService.create({
  product_id: productId,
  composition: "100% Cotton",
  // ... other properties
})
```

To Type 3 (Configurable Swatch Set):
```typescript
await fabricProductService.createConfigurableSwatchSetProduct(
  productId,
  { min_selections: 5, max_selections: 5, set_price: 1000 }
)
```

To Type 4 (Fixed Swatch):
```typescript
// Update product metadata
await updateProduct(productId, {
  metadata: {
    product_type: "fixed_swatch",
    included_fabrics: [...]
  }
})
```

## Best Practices

1. **Use the right type**: Don't overcomplicate fixed products
2. **Cache fabric data** for configurable products
3. **Store fabric snapshots** with orders for history
4. **Validate selections** on both client and server
5. **Use standard products** when possible (Types 2 & 4)

## Troubleshooting

### Common Issues

#### "Product does not allow fabric selection"
- Only applies to Types 1 & 3
- Check if product has `product_fabric_config` entry

#### "Minimum selections not met"
- Only for Type 3 (Configurable Swatch Set)
- Verify `min_fabric_selections` setting

#### Fixed product showing selection UI
- Check product metadata `product_type`
- Fixed types shouldn't have `product_fabric_config` entry

## Summary

- **Types 1 & 3**: Need custom module for user selection
- **Types 2 & 4**: Standard products with fabric metadata
- Use `fabric-products` module only when user selection is required
- Use `fabric-details` module for storing fabric information on fixed products