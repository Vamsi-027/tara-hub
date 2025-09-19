# Fabric Store Checkout API Contract

## Overview

This document defines the API contract between the Medusa backend and the fabric-store frontend for cart management, checkout, and payment processing using Stripe as the payment provider.

## Architecture Principles

1. **Server-side authority**: All pricing, tax, and total calculations happen server-side
2. **Idempotency**: All critical operations support idempotency keys
3. **Security**: Stripe webhooks verified, sensitive data never exposed
4. **Consistency**: Inventory and payment state managed transactionally
5. **Guest & Auth**: Support both guest checkout and logged-in users

## API Endpoints

### 1. Cart Management

#### Create Cart
```http
POST /store/carts
Content-Type: application/json
X-Idempotency-Key: <unique-key>

{
  "region_id": "reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ",
  "email": "customer@example.com",  // Optional for guests
  "currency_code": "usd",
  "metadata": {
    "source": "fabric-store",
    "session_id": "sess_123"  // For guest tracking
  }
}

Response 200:
{
  "cart": {
    "id": "cart_abc123",
    "email": "customer@example.com",
    "currency_code": "usd",
    "region_id": "reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ",
    "items": [],
    "shipping_address": null,
    "billing_address": null,
    "subtotal": 0,
    "tax_total": 0,
    "shipping_total": 0,
    "discount_total": 0,
    "total": 0,
    "created_at": "2025-01-18T10:00:00Z",
    "updated_at": "2025-01-18T10:00:00Z",
    "metadata": {
      "source": "fabric-store",
      "session_id": "sess_123"
    }
  }
}
```

#### Get Cart
```http
GET /store/carts/:cart_id

Response 200:
{
  "cart": { /* same structure as create */ }
}
```

#### Add Line Item
```http
POST /store/carts/:cart_id/line-items
Content-Type: application/json
X-Idempotency-Key: <unique-key>

{
  "variant_id": "variant_123",
  "quantity": 2,
  "metadata": {
    "customization": "monogram: ABC"
  }
}

Response 200:
{
  "cart": { /* updated cart with new item */ }
}
```

#### Update Line Item
```http
PATCH /store/carts/:cart_id/line-items/:item_id
Content-Type: application/json

{
  "quantity": 3
}

Response 200:
{
  "cart": { /* updated cart */ }
}
```

#### Remove Line Item
```http
DELETE /store/carts/:cart_id/line-items/:item_id

Response 200:
{
  "cart": { /* updated cart */ }
}
```

#### Set Addresses
```http
POST /store/carts/:cart_id/addresses
Content-Type: application/json

{
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Main St",
    "address_2": "Apt 4",
    "city": "San Francisco",
    "province": "CA",
    "postal_code": "94105",
    "country_code": "us",
    "phone": "+14155551234"
  },
  "billing_address": null  // Uses shipping if null
}

Response 200:
{
  "cart": { /* updated cart with addresses */ }
}
```

#### Set Shipping Method
```http
POST /store/carts/:cart_id/shipping-methods
Content-Type: application/json

{
  "option_id": "so_standard_shipping"
}

Response 200:
{
  "cart": {
    /* updated cart with shipping method and recalculated totals */
  }
}
```

### 2. Payment Session Management

#### Create Payment Session
```http
POST /store/carts/:cart_id/payment-sessions
Content-Type: application/json
X-Idempotency-Key: <unique-key>

{
  "provider_id": "stripe"
}

Response 200:
{
  "payment_session": {
    "id": "ps_123",
    "provider_id": "stripe",
    "cart_id": "cart_abc123",
    "status": "pending",
    "data": {
      "client_secret": "pi_3ABC123_secret_XYZ",
      "payment_intent_id": "pi_3ABC123",
      "publishable_key": "pk_test_123"
    },
    "amount": 15000,  // In cents
    "currency_code": "usd",
    "created_at": "2025-01-18T10:00:00Z"
  }
}
```

#### Update Payment Session (for saved cards)
```http
PATCH /store/carts/:cart_id/payment-sessions
Content-Type: application/json

{
  "provider_id": "stripe",
  "payment_method_id": "pm_123"  // Stripe saved payment method
}

Response 200:
{
  "payment_session": { /* updated session */ }
}
```

### 3. Checkout Completion

#### Complete Checkout
```http
POST /store/carts/:cart_id/complete
Content-Type: application/json
X-Idempotency-Key: <unique-key>

{
  "payment_intent_id": "pi_3ABC123"  // From Stripe confirmation
}

Response 200:
{
  "order": {
    "id": "order_xyz789",
    "display_id": 1001,
    "cart_id": "cart_abc123",
    "email": "customer@example.com",
    "status": "pending",
    "fulfillment_status": "not_fulfilled",
    "payment_status": "awaiting",
    "currency_code": "usd",
    "subtotal": 12000,
    "tax_total": 1080,
    "shipping_total": 1000,
    "discount_total": 0,
    "total": 14080,
    "items": [
      {
        "id": "item_123",
        "title": "Premium Fabric",
        "variant_id": "variant_123",
        "quantity": 2,
        "unit_price": 6000,
        "subtotal": 12000,
        "total": 12000,
        "metadata": {
          "customization": "monogram: ABC"
        }
      }
    ],
    "shipping_address": { /* address object */ },
    "billing_address": { /* address object */ },
    "payment": {
      "id": "pay_123",
      "amount": 14080,
      "currency_code": "usd",
      "provider_id": "stripe",
      "data": {
        "payment_intent_id": "pi_3ABC123",
        "charge_id": "ch_3ABC123"
      }
    },
    "created_at": "2025-01-18T10:05:00Z",
    "metadata": {
      "source": "fabric-store"
    }
  }
}

Response 400 (Payment not confirmed):
{
  "error": {
    "code": "PAYMENT_NOT_CONFIRMED",
    "message": "Payment has not been confirmed by Stripe"
  }
}

Response 409 (Already completed):
{
  "error": {
    "code": "CART_ALREADY_COMPLETED",
    "message": "This cart has already been completed",
    "order_id": "order_xyz789"
  }
}
```

### 4. Order Management

#### List Orders (Authenticated)
```http
GET /store/orders
Authorization: Bearer <customer-token>

Query Parameters:
- limit: 20 (default)
- offset: 0 (default)
- fields: items,payment,fulfillments
- order: created_at:desc (default)

Response 200:
{
  "orders": [/* array of orders */],
  "count": 42,
  "offset": 0,
  "limit": 20
}
```

#### Get Order (Guest or Auth)
```http
GET /store/orders/:order_id?email=customer@example.com

Response 200:
{
  "order": { /* order object */ }
}

Response 403 (Email mismatch):
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Email does not match order"
  }
}
```

### 5. Webhook Endpoint (Internal)

#### Stripe Webhook
```http
POST /webhooks/stripe
Stripe-Signature: <webhook-signature>

Body: <raw Stripe event JSON>

Response 200: {}  // Acknowledged

Handles events:
- payment_intent.succeeded
- payment_intent.payment_failed
- payment_intent.canceled
- checkout.session.completed
- charge.refunded
- charge.dispute.created
```

## Stripe Metadata Mapping

All Stripe objects include metadata for correlation:

```javascript
// PaymentIntent metadata
{
  "cart_id": "cart_abc123",
  "customer_id": "cust_456",  // If logged in
  "order_id": "order_xyz789",  // After order creation
  "idempotency_key": "idem_abc123",
  "source": "fabric-store",
  "region_id": "reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ"
}
```

## Error Responses

Standard error format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}  // Optional additional context
  }
}
```

Common error codes:
- `CART_NOT_FOUND` - Cart doesn't exist
- `CART_EXPIRED` - Cart older than 7 days
- `CART_ALREADY_COMPLETED` - Cart has been checked out
- `INSUFFICIENT_INVENTORY` - Stock unavailable
- `PAYMENT_REQUIRED` - No payment session
- `PAYMENT_NOT_CONFIRMED` - Payment not verified
- `INVALID_ADDRESS` - Address validation failed
- `REGION_NOT_AVAILABLE` - Region not supported

## Security Considerations

1. **Authentication**:
   - Guest carts tracked by cart_id + session
   - Authenticated users via JWT Bearer token
   - Order retrieval requires email verification for guests

2. **Webhook Verification**:
   - Always verify Stripe-Signature header
   - Replay protection via event IDs
   - Idempotent event processing

3. **Rate Limiting**:
   - Cart creation: 10/minute per IP
   - Checkout completion: 5/minute per cart
   - Order retrieval: 20/minute per user

4. **Data Validation**:
   - Server-side price calculation only
   - Address validation via service
   - Email verification for guest orders

## Implementation Notes

### Cart Lifecycle
1. Carts expire after 7 days of inactivity
2. Completed carts are archived, not deleted
3. Abandoned cart recovery via email (optional)

### Inventory Management
1. Soft reservation on cart addition (15 minutes)
2. Hard reservation on payment session creation
3. Deduction on order confirmation
4. Restoration on payment failure

### Payment Flow
1. Frontend creates cart and adds items
2. Frontend requests payment session (gets client_secret)
3. Frontend confirms payment with Stripe
4. Frontend calls complete endpoint
5. Backend verifies payment with Stripe
6. Backend creates order if verified
7. Webhook confirms and updates order status

## Testing

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

### Test Webhook Events
```bash
# Using Stripe CLI
stripe listen --forward-to localhost:9000/webhooks/stripe
stripe trigger payment_intent.succeeded
```

## Migration Path

1. Enable new checkout with feature flag
2. Run in parallel with legacy for 1 week
3. Compare metrics and fix issues
4. Gradual rollout: 10% → 50% → 100%
5. Deprecate legacy after 30 days stable