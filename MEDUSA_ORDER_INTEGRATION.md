# Medusa Order Integration - Complete Guide

## Overview
This guide explains how the fabric-store checkout process integrates with Medusa to create orders that appear in the Medusa Admin panel.

## Architecture

### Order Flow
1. **Cart Preparation** → Customer adds items to cart
2. **Checkout Process** → Customer enters shipping/payment details
3. **Medusa Order Creation** → Order created in Medusa backend
4. **Payment Processing** → Stripe processes payment
5. **Order Completion** → Order status updated in Medusa

## Implementation Details

### 1. Cart Structure
The fabric-store uses a custom cart structure that tracks:
- **Fabric Items**: With yardage (e.g., 2.5 yards)
- **Swatch Items**: With quantity (e.g., 5 swatches)

```javascript
// Cart item example
{
  id: "fabric-prod123-var456",
  variantId: "var456",
  productId: "prod123",
  title: "Premium Velvet",
  variant: "Fabric Per Yard",
  price: 5500, // $55.00 in cents
  quantity: 1,  // Always 1 for fabric
  yardage: 2.5, // Actual yards ordered
  type: "fabric"
}
```

### 2. Order Creation API (`/api/create-medusa-order`)

The API endpoint handles:
1. **Transform cart items** to Medusa format
2. **Create order** using orderService
3. **Generate payment intent** with Stripe
4. **Link order to payment** via metadata

```javascript
// POST /api/create-medusa-order
{
  email: "customer@example.com",
  items: [...cart items...],
  shipping: {
    firstName: "John",
    lastName: "Doe",
    address: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001"
  },
  total: 15000 // $150.00 in cents
}
```

### 3. Order Service Integration

The `orderService` uses Medusa's cart/checkout flow:

```
Create Cart → Add Items → Set Address → Add Shipping → Complete Cart
```

This ensures orders appear in Medusa Admin with:
- Proper line items
- Customer information
- Shipping details
- Order totals
- Payment status

### 4. Stripe Webhook Handler

Webhooks update order status based on payment events:
- `payment_intent.succeeded` → Order marked as "paid"
- `payment_intent.failed` → Order marked as "failed"
- `charge.succeeded` → Receipt URL saved

## Configuration

### Environment Variables
```env
# Medusa Backend
MEDUSA_BACKEND_URL=https://medusa-backend-production-3655.up.railway.app
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_49ebbbe...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Regions
NEXT_PUBLIC_MEDUSA_REGION_ID_USD=reg_01K5C338DE9F4FHEAFE46PQW3D
```

### Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhook/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## Testing the Integration

### 1. Test Order Creation
```bash
# Run test script
node frontend/experiences/fabric-store/scripts/test-medusa-order.js
```

### 2. Test Checkout Flow
1. Add items to cart at `/browse`
2. Go to `/cart`
3. Click "Proceed to Checkout"
4. Fill in details
5. Use test card: `4242 4242 4242 4242`
6. Complete order

### 3. Verify in Medusa Admin
1. Login to: https://medusa-backend-production-3655.up.railway.app/admin
2. Go to Orders section
3. New order should appear with:
   - Customer details
   - Line items with quantities
   - Payment status
   - Total amount

## Order Status Management

### Status Flow
```
pending → processing → paid → shipped → delivered
                ↓
             failed / cancelled
```

### Update Order Status Programmatically
```javascript
// Mark as paid
await orderService.updateOrderStatus(orderId, 'paid')

// Add tracking
await orderService.addTracking(orderId, 'TRACK123456')

// Cancel order
await orderService.updateOrderStatus(orderId, 'cancelled')
```

## Troubleshooting

### Order Not Appearing in Medusa

1. **Check cart creation**:
   ```bash
   curl -X POST https://medusa-backend-production-3655.up.railway.app/store/carts \
     -H "x-publishable-api-key: YOUR_KEY" \
     -d '{"region_id": "YOUR_REGION_ID"}'
   ```

2. **Verify region exists**:
   ```bash
   curl https://medusa-backend-production-3655.up.railway.app/store/regions \
     -H "x-publishable-api-key: YOUR_KEY"
   ```

3. **Check browser console** for API errors
4. **Review server logs** for detailed error messages

### Payment Issues

1. **Stripe not configured**: Check `STRIPE_SECRET_KEY`
2. **Webhook not firing**: Verify webhook secret and URL
3. **Order status not updating**: Check webhook handler logs

### Common Errors

- **"Region not found"**: Update `NEXT_PUBLIC_MEDUSA_REGION_ID_USD`
- **"Cart creation failed"**: Check publishable key permissions
- **"Payment intent failed"**: Verify Stripe configuration
- **"Order completion failed"**: Ensure all required fields are provided

## Production Checklist

- [ ] Environment variables configured
- [ ] Stripe webhook endpoint added
- [ ] Region IDs updated
- [ ] Products have variants with SKUs
- [ ] Inventory management enabled
- [ ] Shipping options configured in Medusa
- [ ] Test order placed successfully
- [ ] Order appears in Medusa Admin
- [ ] Payment status updates correctly
- [ ] Customer receives confirmation email

## API Reference

### Create Order
```
POST /api/create-medusa-order
```

### Get Order Status
```
GET /api/orders?id=ORDER_ID
```

### Update Order
```
PUT /api/orders
{
  orderId: "ORDER_ID",
  status: "shipped",
  tracking: "TRACK123"
}
```

## Summary

The integration ensures:
1. ✅ Orders created in Medusa backend
2. ✅ Visible in Medusa Admin panel
3. ✅ Payment processing with Stripe
4. ✅ Automatic status updates via webhooks
5. ✅ Proper inventory management
6. ✅ Customer notifications

This production-ready integration provides a seamless checkout experience while maintaining full visibility and control through the Medusa Admin panel.