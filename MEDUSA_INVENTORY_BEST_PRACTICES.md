# Medusa v2 Inventory Management - Production Best Practices

## Overview

This is a comprehensive, production-ready inventory management solution for Medusa v2 following industry best practices. The system provides real-time stock tracking, multi-location support, reservation management, and automated workflows.

## Architecture

### Core Components

1. **Custom Inventory Module** (`/medusa/src/modules/inventory_management/`)
   - Models: InventoryItem, InventoryLevel, InventoryLocation, ReservationItem
   - Service: Full CRUD operations with business logic
   - Workflows: Automated reservation and adjustment processes
   - API Routes: RESTful admin endpoints

2. **Data Models**
   ```typescript
   InventoryItem {
     id: string
     sku: string
     variant_id: string
     title: string
     metadata: object
   }

   InventoryLevel {
     inventory_item_id: string
     location_id: string
     stocked_quantity: number    // Total in warehouse
     reserved_quantity: number   // Reserved for orders
     available_quantity: number  // Available to sell (stocked - reserved)
     incoming_quantity: number   // Expected from suppliers
   }

   InventoryLocation {
     id: string
     name: string
     code: string (unique)
     address: object
     is_active: boolean
   }

   ReservationItem {
     inventory_item_id: string
     location_id: string
     quantity: number
     line_item_id: string
     expires_at: Date
   }
   ```

## Implementation Steps

### 1. Enable the Inventory Module

Add to your `medusa-config.ts`:

```typescript
modules: [
  // ... other modules
  { resolve: "./src/modules/inventory_management" },
]
```

### 2. Run Database Migration

```bash
cd medusa
npx medusa db:migrate
```

### 3. Initialize Inventory Data

Run the setup script:

```bash
cd medusa
npm run setup:inventory
# or
npx medusa exec src/scripts/setup-inventory.ts
```

This will:
- Create inventory locations (Main Warehouse, Overflow Storage)
- Create inventory items for all product variants
- Set initial stock levels (500 for swatches, 200 for fabric)
- Enable inventory management on variants

### 4. Configure Product Variants

For each product variant in Medusa Admin:
1. Enable "Manage inventory"
2. Set "Allow backorders" based on business needs
3. Ensure SKU is unique and set

## API Endpoints

### Admin Inventory Management

#### List Inventory Items with Levels
```bash
GET /admin/inventory?variant_id=xxx&location_id=yyy

Response:
{
  "inventory_items": [{
    "id": "inv_123",
    "sku": "FABRIC-001-YARD",
    "variant_id": "variant_123",
    "levels": [{
      "location_id": "loc_123",
      "stocked_quantity": 200,
      "reserved_quantity": 10,
      "available_quantity": 190
    }],
    "total_available": 190,
    "total_stocked": 200,
    "total_reserved": 10
  }]
}
```

#### Create Inventory Item
```bash
POST /admin/inventory
{
  "sku": "FABRIC-001-YARD",
  "variant_id": "variant_123",
  "title": "Premium Velvet - By the Yard"
}
```

#### Adjust Inventory
```bash
POST /admin/inventory/adjust
{
  "inventory_item_id": "inv_123",
  "location_id": "loc_123",
  "adjustment": 50,  // Positive to add, negative to remove
  "reason": "New shipment received"
}
```

#### Bulk Adjust Inventory
```bash
POST /admin/inventory/adjust
{
  "adjustments": [{
    "inventory_item_id": "inv_123",
    "location_id": "loc_123",
    "adjustment": 50
  }, {
    "inventory_item_id": "inv_456",
    "location_id": "loc_123",
    "adjustment": -10
  }]
}
```

### Store API Integration

The existing `/store/products-with-metadata` endpoint now includes real-time inventory:

```javascript
// In fabric-store API
const product = await fetch(`${MEDUSA_URL}/store/products-with-metadata?id=${id}`)

// Response includes:
{
  "variants": [{
    "id": "variant_123",
    "title": "By the Yard",
    "inventory_quantity": 190,  // Available quantity
    "manage_inventory": true,
    "allow_backorder": true
  }]
}
```

## Workflows

### 1. Order Placement Workflow

When an order is placed:
1. System checks available inventory
2. Creates reservations for each line item
3. Updates available_quantity (reduces it)
4. Reservation expires after 15 minutes if not confirmed

### 2. Order Fulfillment Workflow

When an order is fulfilled:
1. Confirms reservations
2. Reduces stocked_quantity
3. Removes reservations
4. Updates available_quantity

### 3. Order Cancellation Workflow

When an order is cancelled:
1. Finds all reservations for the order
2. Deletes reservations
3. Restores available_quantity

## Event Subscribers

The system automatically handles these events:

- `order.placed` → Creates inventory reservations
- `order.fulfilled` → Confirms inventory reduction
- `order.canceled` → Releases reservations
- `product-variant.updated` → Syncs inventory items

## Best Practices

### 1. Stock Management

```javascript
// Always use locations
const mainWarehouse = await inventoryService.listLocations({
  code: "main-warehouse"
})

// Check availability before orders
const available = await inventoryService.getAvailableQuantity(
  inventoryItemId,
  [locationId]
)

// Use workflows for complex operations
await adjustInventoryWorkflow(scope).run({
  input: { inventory_item_id, location_id, adjustment }
})
```

### 2. Reservation Management

```javascript
// Create reservation with expiry
await inventoryService.createReservation({
  inventory_item_id: "inv_123",
  location_id: "loc_123",
  quantity: 5,
  line_item_id: "li_123",
  expires_at: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
})

// Always confirm or delete reservations
await inventoryService.confirmReservation(reservationId)
```

### 3. Multi-Location Support

```javascript
// Set up multiple locations
const locations = [
  { name: "Main Warehouse", code: "main" },
  { name: "Drop Ship Partner", code: "dropship" },
  { name: "Showroom", code: "showroom" }
]

// Track inventory per location
await inventoryService.createInventoryLevel({
  inventory_item_id: "inv_123",
  location_id: "loc_main",
  stocked_quantity: 100
})
```

### 4. Backorder Management

For fabric businesses, enable backorders for made-to-order items:

```javascript
await productService.updateProductVariants(variantId, {
  manage_inventory: true,
  allow_backorder: true  // Accept orders even when out of stock
})
```

## Monitoring & Alerts

### Low Stock Alert

```javascript
// Check for low stock items
const lowStockThreshold = 10

const items = await inventoryService.listInventoryItems()
for (const item of items) {
  const available = await inventoryService.getAvailableQuantity(item.id)

  if (available < lowStockThreshold) {
    // Send alert
    await notificationService.send({
      to: "admin@example.com",
      subject: "Low Stock Alert",
      body: `${item.title} has only ${available} units available`
    })
  }
}
```

### Inventory Reports

```javascript
// Generate inventory report
const report = await inventoryService.generateReport({
  group_by: "location",
  include_reserved: true,
  include_incoming: true
})
```

## Testing

### Unit Tests

```javascript
// test/inventory.test.ts
describe("Inventory Management", () => {
  it("should reserve inventory on order", async () => {
    const reservation = await inventoryService.createReservation({
      inventory_item_id: "inv_123",
      location_id: "loc_123",
      quantity: 5
    })

    expect(reservation).toBeDefined()
    expect(reservation.quantity).toBe(5)
  })
})
```

### Integration Tests

```bash
# Test inventory sync
curl -X POST http://localhost:9000/admin/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{"inventory_item_id":"inv_123","location_id":"loc_123","adjustment":10}'
```

## Troubleshooting

### Common Issues

1. **"Insufficient inventory" error**
   - Check available_quantity, not stocked_quantity
   - Verify reservations aren't blocking stock
   - Enable backorders if appropriate

2. **Inventory not syncing**
   - Ensure manage_inventory is enabled on variant
   - Check inventory_item exists for variant
   - Verify location is active

3. **Reservations not clearing**
   - Check order status transitions
   - Verify event subscribers are running
   - Look for expired reservations

### Debug Commands

```bash
# Check inventory status
npx medusa exec --file src/scripts/check-inventory.ts

# Clear expired reservations
npx medusa exec --file src/scripts/clear-reservations.ts

# Recalculate available quantities
npx medusa exec --file src/scripts/recalculate-inventory.ts
```

## Migration from Simple Stock

If migrating from simple inventory_quantity field:

```javascript
// Migration script
const variants = await productService.listProductVariants()

for (const variant of variants) {
  // Create inventory item
  const item = await inventoryService.createInventoryItem({
    sku: variant.sku,
    variant_id: variant.id
  })

  // Set initial level from old quantity
  await inventoryService.createInventoryLevel({
    inventory_item_id: item.id,
    location_id: defaultLocation.id,
    stocked_quantity: variant.inventory_quantity || 0
  })
}
```

## Performance Optimization

1. **Use database indexes** (already configured)
2. **Cache frequently accessed levels**
3. **Batch operations when possible**
4. **Use workflows for complex operations**
5. **Implement pagination for large inventories**

## Security Considerations

1. **Role-based access**: Only admins can adjust inventory
2. **Audit logging**: Track all inventory changes
3. **Validation**: Prevent negative stock without backorders
4. **Rate limiting**: Prevent inventory manipulation attacks

## Summary

This production-ready inventory system provides:
- ✅ Real-time stock tracking
- ✅ Multi-location support
- ✅ Reservation management
- ✅ Automated workflows
- ✅ Event-driven updates
- ✅ Backorder support
- ✅ Low stock alerts
- ✅ Full API coverage
- ✅ Production monitoring
- ✅ Comprehensive testing

## Next Steps

1. Run `npm run setup:inventory` to initialize
2. Update product variants in Medusa Admin
3. Test with a sample order
4. Monitor inventory levels
5. Set up low stock alerts
6. Configure backup locations

This is the industry-standard, best-practice approach to inventory management in Medusa v2!