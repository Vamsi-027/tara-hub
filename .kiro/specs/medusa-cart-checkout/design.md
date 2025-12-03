# Design Document: Medusa Cart/Checkout Restoration

## Overview

This design document specifies the architecture and implementation approach for restoring Medusa-native cart and checkout functionality. The system will provide a complete, production-ready e-commerce checkout flow using Medusa v2 framework patterns, Stripe payment integration, and comprehensive inventory management.

The implementation follows clean architecture principles with clear separation between API routes, business logic (services and workflows), data access (repositories), and external integrations (Stripe, email notifications). The design emphasizes idempotency, error handling, and observability to ensure reliable order processing.

### Key Design Goals

1. **Medusa v2 Native**: Leverage Medusa framework workflows, modules, and container resolution
2. **Idempotent Operations**: All critical operations support retry without side effects
3. **Inventory Safety**: Prevent overselling through reservation system
4. **Payment Security**: Webhook signature verification and payment state validation
5. **Feature Flag Control**: Safe deployment and rollback capabilities
6. **Observability**: Comprehensive logging and error tracking

## Architecture

### System Context

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Fabric Store   │────────▶│  Medusa Backend  │────────▶│   Stripe    │
│   Frontend      │  HTTPS  │   (Node.js)      │  HTTPS  │     API     │
│   (Next.js)     │◀────────│                  │◀────────│             │
└─────────────────┘         └──────────────────┘         └─────────────┘
                                     │                           │
                                     │                           │
                                     ▼                           ▼
                            ┌──────────────────┐       ┌─────────────┐
                            │   PostgreSQL     │       │  Webhooks   │
                            │    Database      │       │  (Events)   │
                            └──────────────────┘       └─────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  Resend Email    │
                            │   Notifications  │
                            └──────────────────┘
```

### Component Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        API Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Cart Routes  │  │Checkout Route│  │Webhook Route │        │
│  │ /store/carts │  │/store/checkout│ │/webhooks/stripe│       │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     Service Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │CartService   │  │CheckoutService│ │PaymentService│        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │InventoryServ │  │ValidationServ│                           │
│  └──────────────┘  └──────────────┘                           │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    Workflow Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Checkout     │  │  Inventory   │  │  Payment     │        │
│  │  Workflow    │  │  Workflow    │  │  Workflow    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                   Data Access Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │CartRepository│  │OrderRepository│ │InventoryRepo │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Database Layer                             │
│                    PostgreSQL (Neon)                            │
└────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Cart Management Module

#### Cart Model
```typescript
interface Cart {
  id: string
  email?: string
  customer_id?: string
  region_id: string
  currency_code: string
  items: CartItem[]
  shipping_address?: Address
  billing_address?: Address
  shipping_method_id?: string
  payment_session?: PaymentSession
  subtotal: number
  tax_total: number
  shipping_total: number
  discount_total: number
  total: number
  completed_at?: Date
  expires_at: Date
  metadata?: Record<string, any>
  created_at: Date
  updated_at: Date
}

interface CartItem {
  id: string
  cart_id: string
  variant_id: string
  product_id: string
  title: string
  quantity: number
  unit_price: number
  subtotal: number
  tax_total: number
  total: number
  metadata?: Record<string, any>
}
```

#### CartService Interface
```typescript
interface ICartService {
  // Core operations
  create(data: CreateCartInput): Promise<Cart>
  retrieve(id: string): Promise<Cart>
  update(id: string, data: UpdateCartInput): Promise<Cart>
  delete(id: string): Promise<void>
  
  // Line item management
  addLineItem(cartId: string, item: AddLineItemInput): Promise<Cart>
  updateLineItem(cartId: string, itemId: string, quantity: number): Promise<Cart>
  removeLineItem(cartId: string, itemId: string): Promise<Cart>
  
  // Address management
  setShippingAddress(cartId: string, address: Address): Promise<Cart>
  setBillingAddress(cartId: string, address: Address): Promise<Cart>
  
  // Shipping method
  setShippingMethod(cartId: string, methodId: string): Promise<Cart>
  
  // Totals calculation
  calculateTotals(cart: Cart): Promise<CartTotals>
  
  // Completion
  complete(cartId: string): Promise<Cart>
}
```

### 2. Checkout Module

#### CheckoutService Interface
```typescript
interface ICheckoutService {
  // Payment session
  createPaymentSession(cartId: string, providerId: string): Promise<PaymentSession>
  updatePaymentSession(sessionId: string, data: any): Promise<PaymentSession>
  
  // Checkout completion
  complete(cartId: string, paymentIntentId: string): Promise<Order>
  
  // Validation
  validateCart(cart: Cart): Promise<ValidationResult>
  validateInventory(items: CartItem[]): Promise<ValidationResult>
  validatePayment(paymentIntentId: string): Promise<ValidationResult>
}
```

#### Checkout Workflow
```typescript
// Workflow steps for checkout completion
const checkoutWorkflow = {
  steps: [
    'validateCart',           // Ensure cart is valid
    'validateInventory',      // Check stock availability
    'reserveInventory',       // Create reservations
    'verifyPayment',          // Confirm with Stripe
    'calculateFinalTotals',   // Recalculate all totals
    'createOrder',            // Create order record
    'deductInventory',        // Convert reservation to deduction
    'sendConfirmation',       // Send email
    'completeCart'            // Mark cart as completed
  ],
  compensation: [
    'releaseInventory',       // On failure, release reservations
    'cancelPayment',          // On failure, cancel payment
    'logError'                // Log failure details
  ]
}
```

### 3. Payment Integration Module

#### PaymentService Interface
```typescript
interface IPaymentService {
  // Stripe integration
  createPaymentIntent(cart: Cart): Promise<Stripe.PaymentIntent>
  retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent>
  confirmPaymentIntent(id: string): Promise<Stripe.PaymentIntent>
  cancelPaymentIntent(id: string): Promise<Stripe.PaymentIntent>
  
  // Webhook processing
  processWebhook(event: Stripe.Event): Promise<void>
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event
}
```

#### Payment Session Model
```typescript
interface PaymentSession {
  id: string
  cart_id: string
  provider_id: string
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'canceled'
  amount: number
  currency_code: string
  data: {
    client_secret: string
    payment_intent_id: string
    publishable_key: string
  }
  created_at: Date
  updated_at: Date
}
```

### 4. Inventory Management Module

#### InventoryService Interface
```typescript
interface IInventoryService {
  // Reservation management
  createReservation(items: CartItem[], cartId: string): Promise<Reservation[]>
  releaseReservation(cartId: string): Promise<void>
  convertReservationToDeduction(cartId: string): Promise<void>
  
  // Stock checking
  checkAvailability(variantId: string, quantity: number): Promise<boolean>
  getAvailableQuantity(variantId: string): Promise<number>
  
  // Expiration handling
  expireReservations(): Promise<void>
}
```

#### Reservation Model
```typescript
interface Reservation {
  id: string
  cart_id: string
  variant_id: string
  quantity: number
  location_id: string
  expires_at: Date
  created_at: Date
}
```

### 5. Validation Module

#### ValidationService Interface
```typescript
interface IValidationService {
  // Cart validation
  validateCart(cart: Cart): ValidationResult
  validateLineItems(items: CartItem[]): ValidationResult
  validateMinimumOrderQuantity(item: CartItem): ValidationResult
  
  // Address validation
  validateAddress(address: Address): ValidationResult
  validateShippingAddress(address: Address, region: Region): ValidationResult
  
  // Payment validation
  validatePaymentAmount(cart: Cart, paymentIntent: Stripe.PaymentIntent): ValidationResult
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

interface ValidationError {
  code: string
  message: string
  field?: string
  details?: any
}
```

### 6. Order Module

#### Order Model
```typescript
interface Order {
  id: string
  display_id: number
  cart_id: string
  customer_id?: string
  email: string
  region_id: string
  currency_code: string
  status: 'pending' | 'processing' | 'completed' | 'canceled'
  fulfillment_status: 'not_fulfilled' | 'partially_fulfilled' | 'fulfilled'
  payment_status: 'not_paid' | 'awaiting' | 'captured' | 'refunded' | 'partially_refunded'
  items: OrderItem[]
  shipping_address: Address
  billing_address: Address
  shipping_method: ShippingMethod
  payment: Payment
  subtotal: number
  tax_total: number
  shipping_total: number
  discount_total: number
  total: number
  metadata?: Record<string, any>
  created_at: Date
  updated_at: Date
}
```

## Data Models

### Database Schema

#### carts table
```sql
CREATE TABLE carts (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255),
  customer_id VARCHAR(255),
  region_id VARCHAR(255) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  shipping_address_id VARCHAR(255),
  billing_address_id VARCHAR(255),
  shipping_method_id VARCHAR(255),
  payment_session_id VARCHAR(255),
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax_total INTEGER NOT NULL DEFAULT 0,
  shipping_total INTEGER NOT NULL DEFAULT 0,
  discount_total INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_carts_customer (customer_id),
  INDEX idx_carts_email (email),
  INDEX idx_carts_expires (expires_at),
  INDEX idx_carts_completed (completed_at)
);
```

#### cart_items table
```sql
CREATE TABLE cart_items (
  id VARCHAR(255) PRIMARY KEY,
  cart_id VARCHAR(255) NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  tax_total INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_cart_items_cart (cart_id),
  INDEX idx_cart_items_variant (variant_id)
);
```

#### payment_sessions table
```sql
CREATE TABLE payment_sessions (
  id VARCHAR(255) PRIMARY KEY,
  cart_id VARCHAR(255) NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  provider_id VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_payment_sessions_cart (cart_id),
  INDEX idx_payment_sessions_status (status)
);
```

#### inventory_reservations table
```sql
CREATE TABLE inventory_reservations (
  id VARCHAR(255) PRIMARY KEY,
  cart_id VARCHAR(255) NOT NULL,
  variant_id VARCHAR(255) NOT NULL,
  location_id VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_reservations_cart (cart_id),
  INDEX idx_reservations_variant (variant_id),
  INDEX idx_reservations_expires (expires_at),
  UNIQUE (cart_id, variant_id, location_id)
);
```

#### idempotency_keys table
```sql
CREATE TABLE idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  request_path VARCHAR(500) NOT NULL,
  request_method VARCHAR(10) NOT NULL,
  request_body JSONB,
  response_code INTEGER,
  response_body JSONB,
  recovery_point VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_idempotency_created (created_at)
);
```

### Data Relationships

```
Cart (1) ──────▶ (N) CartItem
  │
  ├──────▶ (1) ShippingAddress
  ├──────▶ (1) BillingAddress
  ├──────▶ (1) PaymentSession
  └──────▶ (N) InventoryReservation

Order (1) ──────▶ (N) OrderItem
  │
  ├──────▶ (1) ShippingAddress
  ├──────▶ (1) BillingAddress
  ├──────▶ (1) Payment
  └──────▶ (N) Fulfillment
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Cart Creation Completeness
*For any* valid cart creation request with region and currency, creating a cart should result in a cart object with a unique ID, the specified region, and the specified currency code.
**Validates: Requirements 1.1**

### Property 2: Line Item Addition
*For any* existing cart and valid variant with quantity, adding the line item should result in the cart containing that item with the specified quantity.
**Validates: Requirements 1.2**

### Property 3: Total Recalculation on Update
*For any* cart with line items, updating a line item quantity should result in cart totals (subtotal, tax, shipping, total) being recalculated to match the sum of all items plus applicable taxes and shipping.
**Validates: Requirements 1.3**

### Property 4: Line Item Removal Invariant
*For any* cart with N line items, removing one item should result in a cart with N-1 items and totals reduced by the removed item's contribution.
**Validates: Requirements 1.4**

### Property 5: Cart Retrieval Round-Trip
*For any* cart created with specific data (items, addresses, totals), retrieving that cart should return all the same data unchanged.
**Validates: Requirements 1.5**

### Property 6: Address Validation Consistency
*For any* address (shipping or billing), setting it on a cart should either succeed if valid or fail with specific field-level error messages if invalid.
**Validates: Requirements 2.1, 2.2, 2.4**

### Property 7: Billing Address Defaulting
*For any* cart where only a shipping address is provided, the billing address should automatically match the shipping address.
**Validates: Requirements 2.3**

### Property 8: Address Change Triggers Recalculation
*For any* cart with an address, changing the address should trigger recalculation of shipping costs and tax totals based on the new address.
**Validates: Requirements 2.5**

### Property 9: Shipping Method Filtering
*For any* cart with a region and shipping address, requesting available shipping methods should return only methods that are valid for that specific region and address combination.
**Validates: Requirements 3.1**

### Property 10: Shipping Method Selection Updates Totals
*For any* cart and valid shipping method, selecting the method should update the cart's shipping_total and total to include the method's cost.
**Validates: Requirements 3.2**

### Property 11: Shipping Method Region Validation
*For any* shipping method selection attempt, the method should only be applied if it is available for the cart's region, otherwise validation should fail.
**Validates: Requirements 3.3**

### Property 12: Address Change Clears Shipping
*For any* cart with a selected shipping method, changing the shipping address should clear the selected method and require reselection.
**Validates: Requirements 3.4**

### Property 13: Payment Intent Amount Accuracy
*For any* cart with calculated totals, creating a payment session should create a Stripe payment intent with an amount exactly matching the cart's total.
**Validates: Requirements 4.1**

### Property 14: Payment Intent Metadata Correlation
*For any* payment session created, the Stripe payment intent should include metadata containing at minimum the cart_id for correlation.
**Validates: Requirements 4.2**

### Property 15: Payment Session Response Completeness
*For any* successful payment session creation, the response should include a client_secret that can be used by the frontend to confirm payment.
**Validates: Requirements 4.3**

### Property 16: Payment Session Failure Isolation
*For any* payment session creation that fails, the cart state should remain unchanged (no side effects from the failure).
**Validates: Requirements 4.4**

### Property 17: Payment Session Idempotency
*For any* payment session creation request with an idempotency key, making the same request multiple times should return the same payment session without creating duplicates.
**Validates: Requirements 4.5**

### Property 18: Checkout Requires Payment Verification
*For any* checkout completion attempt, the system should verify the payment intent status with Stripe before proceeding to create an order.
**Validates: Requirements 5.1**

### Property 19: Order Data Completeness
*For any* successful checkout, the created order should contain all cart data including items, quantities, addresses, payment information, and calculated totals.
**Validates: Requirements 5.2**

### Property 20: Cart Completion Immutability
*For any* cart that has been successfully completed, attempting to modify the cart (add/remove items, change addresses) should fail with an error.
**Validates: Requirements 5.3**

### Property 21: Checkout Cart-Level Idempotency
*For any* completed cart, attempting to complete checkout again should return the existing order ID without creating a duplicate order.
**Validates: Requirements 5.4**

### Property 22: Checkout Request-Level Idempotency
*For any* checkout completion request with an idempotency key, making the same request multiple times should return the same order without creating duplicates.
**Validates: Requirements 5.5**

### Property 23: Inventory Reservation on Payment Session
*For any* cart with line items, creating a payment session should create inventory reservations for all items with quantities matching the cart.
**Validates: Requirements 6.1**

### Property 24: Reservation Expiration Time
*For any* inventory reservation created, the expiration time should be set to exactly 15 minutes from creation time.
**Validates: Requirements 6.2**

### Property 25: Automatic Reservation Release
*For any* inventory reservation that reaches its expiration time without order completion, the reservation should be automatically released and inventory made available again.
**Validates: Requirements 6.3**

### Property 26: Reservation to Deduction Conversion
*For any* successful checkout completion, inventory reservations should be deleted and inventory quantities should be permanently decremented by the reserved amounts.
**Validates: Requirements 6.4**

### Property 27: Immediate Reservation Release on Failure
*For any* payment failure or cancellation, inventory reservations associated with that cart should be immediately released.
**Validates: Requirements 6.5**

### Property 28: MOQ Validation on Add/Update
*For any* product with a minimum order quantity, attempting to add or update a line item with a quantity below the minimum should be rejected with an error specifying the product and required minimum.
**Validates: Requirements 7.1, 7.2, 7.4**

### Property 29: MOQ Validation at Checkout
*For any* cart at checkout time, all line items should meet their respective minimum order quantities, otherwise payment session creation should fail.
**Validates: Requirements 7.3**

### Property 30: Webhook Signature Verification
*For any* incoming Stripe webhook request, the request should only be processed if the Stripe-Signature header is valid, otherwise it should be rejected with an unauthorized error.
**Validates: Requirements 8.1, 15.3**

### Property 31: Payment Success Event Handling
*For any* payment_intent.succeeded webhook event received, the corresponding order's payment status should be updated to captured.
**Validates: Requirements 8.2**

### Property 32: Payment Failure Event Handling
*For any* payment_intent.failed webhook event received, the order payment status should be updated to failed and inventory reservations should be released.
**Validates: Requirements 8.3**

### Property 33: Refund Event Handling
*For any* charge.refunded webhook event received, the corresponding order's payment status should be updated to refunded.
**Validates: Requirements 8.4**

### Property 34: Webhook Error Resilience
*For any* webhook processing that encounters an error, the system should log the error and return a 200 success response to prevent Stripe from retrying.
**Validates: Requirements 8.5**

### Property 35: Order Confirmation Email Trigger
*For any* successfully created order, an order confirmation email should be sent to the customer's email address.
**Validates: Requirements 9.1**

### Property 36: Email Content Completeness
*For any* order confirmation email sent, the email should include the order number, all line items, total amounts, and shipping address.
**Validates: Requirements 9.2**

### Property 37: Email Failure Non-Blocking
*For any* order creation where email sending fails, the order should still be created successfully and the failure should only be logged.
**Validates: Requirements 9.3**

### Property 38: Authenticated Order Filtering
*For any* authenticated customer requesting their orders, only orders associated with their customer ID should be returned.
**Validates: Requirements 10.1**

### Property 39: Guest Order Email Authorization
*For any* guest order retrieval request, the order should only be returned if the provided email exactly matches the order's email.
**Validates: Requirements 10.2, 10.3**

### Property 40: Order Retrieval Completeness
*For any* order retrieved, the response should include all line items, addresses, payment details, and fulfillment status.
**Validates: Requirements 10.4**

### Property 41: Error Response Structure
*For any* validation or processing error, the error response should include an error code and a human-readable message in a consistent structure.
**Validates: Requirements 12.1**

### Property 42: Error Detail Security
*For any* unexpected internal error, the error response to the client should not include sensitive internal details like stack traces or database errors.
**Validates: Requirements 12.5**

### Property 43: Idempotency Key Consistency
*For any* operation (cart creation, payment session, checkout) with an idempotency key, repeating the exact same request should return the same result without side effects.
**Validates: Requirements 13.1, 13.2, 13.3**

### Property 44: Idempotency Key Conflict Detection
*For any* idempotency key reused with different request data, the system should detect the conflict and return an error.
**Validates: Requirements 13.4**

### Property 45: Cart Expiration Processing
*For any* cart that has not been updated for 7 days, running the expiration process should mark the cart as expired.
**Validates: Requirements 14.1**

### Property 46: Completed Cart Expiration Immunity
*For any* cart that has been completed, the cart should never be marked as expired regardless of age.
**Validates: Requirements 14.3**

### Property 47: Rate Limiting Enforcement
*For any* IP address making cart creation requests, exceeding 10 requests per minute should result in subsequent requests being rejected with a rate limit error.
**Validates: Requirements 15.1**

### Property 48: Checkout Rate Limiting
*For any* cart, exceeding 5 checkout completion attempts per minute should result in subsequent attempts being rejected with a rate limit error.
**Validates: Requirements 15.2**

### Property 49: Malformed Input Rejection
*For any* API endpoint receiving malformed JSON, the request should be rejected with a validation error before any processing occurs.
**Validates: Requirements 15.4**

## Error Handling

### Error Response Format

All errors follow a consistent structure:

```typescript
interface ErrorResponse {
  error: {
    code: string           // Machine-readable error code
    message: string        // Human-readable message
    field?: string         // Optional field name for validation errors
    details?: any          // Optional additional context
  }
}
```

### Error Codes

| Code | HTTP Status | Description | Recovery Action |
|------|-------------|-------------|-----------------|
| CART_NOT_FOUND | 404 | Cart does not exist | Create new cart |
| CART_EXPIRED | 410 | Cart older than 7 days | Create new cart |
| CART_ALREADY_COMPLETED | 409 | Cart has been checked out | Retrieve order |
| INSUFFICIENT_INVENTORY | 409 | Stock unavailable | Reduce quantity or remove item |
| PAYMENT_REQUIRED | 402 | No payment session | Create payment session |
| PAYMENT_NOT_CONFIRMED | 402 | Payment not verified | Confirm payment with Stripe |
| INVALID_ADDRESS | 400 | Address validation failed | Correct address fields |
| REGION_NOT_AVAILABLE | 400 | Region not supported | Select different region |
| MOQ_NOT_MET | 400 | Quantity below minimum | Increase quantity |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests | Wait and retry |
| IDEMPOTENCY_CONFLICT | 409 | Key reused with different data | Use new key |
| UNAUTHORIZED | 401 | Authentication failed | Provide valid credentials |
| VALIDATION_ERROR | 400 | Input validation failed | Correct input data |
| INTERNAL_ERROR | 500 | Unexpected error | Contact support |

### Error Handling Strategies

#### 1. Validation Errors
- Validate all inputs before processing
- Return specific field-level errors
- Include examples of valid formats
- Never process invalid data

#### 2. Transient Errors
- Implement exponential backoff for retries
- Use idempotency keys for safe retries
- Log retry attempts
- Set maximum retry limits

#### 3. Payment Errors
- Never create orders without payment confirmation
- Release inventory on payment failure
- Log all payment errors with context
- Provide clear user-facing messages

#### 4. Inventory Errors
- Check availability before reservation
- Handle race conditions gracefully
- Provide alternative products when possible
- Clear error messages about stock status

#### 5. System Errors
- Log full error details internally
- Return generic messages to clients
- Alert on-call engineers for critical errors
- Implement circuit breakers for external services

### Logging Strategy

```typescript
// Error logging format
{
  timestamp: "2025-01-18T10:00:00Z",
  level: "error",
  service: "cart-service",
  operation: "addLineItem",
  cart_id: "cart_abc123",
  error_code: "INSUFFICIENT_INVENTORY",
  error_message: "Product variant_123 has only 5 units available",
  stack_trace: "...",
  request_id: "req_xyz789",
  user_id: "cust_456",
  metadata: {
    variant_id: "variant_123",
    requested_quantity: 10,
    available_quantity: 5
  }
}
```

## Testing Strategy

### Testing Framework Selection

**Property-Based Testing Library**: fast-check (JavaScript/TypeScript)
- Mature library with excellent TypeScript support
- Integrates well with Jest test framework
- Supports complex data generation
- Provides shrinking for minimal failing examples

**Unit Testing Framework**: Jest
- Standard testing framework for Node.js
- Built-in mocking capabilities
- Snapshot testing support
- Code coverage reporting

### Property-Based Testing Configuration

Each property-based test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Include a comment tag referencing the design document property
- Use custom generators for domain-specific data (carts, addresses, products)
- Implement shrinking to find minimal failing cases

Example property test structure:
```typescript
/**
 * Feature: medusa-cart-checkout, Property 1: Cart Creation Completeness
 * For any valid cart creation request with region and currency, creating a cart
 * should result in a cart object with a unique ID, the specified region, and
 * the specified currency code.
 */
test('Property 1: Cart creation completeness', async () => {
  await fc.assert(
    fc.asyncProperty(
      cartCreationInputArbitrary(),
      async (input) => {
        const cart = await cartService.create(input)
        
        expect(cart.id).toBeDefined()
        expect(cart.region_id).toBe(input.region_id)
        expect(cart.currency_code).toBe(input.currency_code)
      }
    ),
    { numRuns: 100 }
  )
})
```

### Unit Testing Strategy

Unit tests will cover:
- **Service Methods**: Test individual service methods with specific inputs
- **Validation Logic**: Test validation functions with valid and invalid data
- **Calculation Logic**: Test total calculations with known values
- **Error Handling**: Test error conditions and error message formatting
- **Edge Cases**: Test boundary conditions (empty carts, zero quantities, etc.)

Example unit test:
```typescript
describe('CartService.calculateTotals', () => {
  it('should calculate correct totals for cart with multiple items', async () => {
    const cart = createTestCart({
      items: [
        { quantity: 2, unit_price: 1000 }, // $20.00
        { quantity: 1, unit_price: 1500 }  // $15.00
      ],
      tax_rate: 0.08,
      shipping_cost: 500 // $5.00
    })
    
    const totals = await cartService.calculateTotals(cart)
    
    expect(totals.subtotal).toBe(3500)      // $35.00
    expect(totals.tax_total).toBe(280)      // $2.80 (8% of subtotal)
    expect(totals.shipping_total).toBe(500) // $5.00
    expect(totals.total).toBe(4280)         // $42.80
  })
})
```

### Integration Testing Strategy

Integration tests will verify:
- **API Endpoints**: Test complete request/response cycles
- **Database Operations**: Test data persistence and retrieval
- **Stripe Integration**: Test payment intent creation and webhook processing
- **Email Notifications**: Test email sending triggers
- **Workflow Execution**: Test multi-step workflows end-to-end

Example integration test:
```typescript
describe('POST /store/carts/:id/line-items', () => {
  it('should add line item and recalculate totals', async () => {
    // Create cart
    const cart = await createTestCart()
    
    // Add line item
    const response = await request(app)
      .post(`/store/carts/${cart.id}/line-items`)
      .send({
        variant_id: 'variant_123',
        quantity: 2
      })
      .expect(200)
    
    // Verify response
    expect(response.body.cart.items).toHaveLength(1)
    expect(response.body.cart.items[0].quantity).toBe(2)
    expect(response.body.cart.subtotal).toBeGreaterThan(0)
    
    // Verify database
    const dbCart = await cartRepository.findById(cart.id)
    expect(dbCart.items).toHaveLength(1)
  })
})
```

### End-to-End Testing Strategy

E2E tests will verify complete user flows:
- **Guest Checkout Flow**: Cart creation → Add items → Addresses → Payment → Order
- **Authenticated Checkout**: Login → Cart → Checkout → Order retrieval
- **Payment Failure Recovery**: Failed payment → Retry → Success
- **Inventory Reservation**: Multiple users → Same product → First succeeds, second fails
- **Webhook Processing**: Order creation → Webhook received → Status updated

Example E2E test:
```typescript
describe('Complete Guest Checkout Flow', () => {
  it('should complete full checkout from cart to order', async () => {
    // 1. Create cart
    const cartResponse = await createCart({
      region_id: 'reg_us',
      currency_code: 'usd'
    })
    const cartId = cartResponse.cart.id
    
    // 2. Add items
    await addLineItem(cartId, {
      variant_id: 'variant_fabric_001',
      quantity: 5
    })
    
    // 3. Set addresses
    await setAddresses(cartId, {
      shipping_address: testAddress,
      billing_address: testAddress
    })
    
    // 4. Select shipping
    await setShippingMethod(cartId, 'standard_shipping')
    
    // 5. Create payment session
    const paymentResponse = await createPaymentSession(cartId, 'stripe')
    const clientSecret = paymentResponse.payment_session.data.client_secret
    
    // 6. Confirm payment with Stripe (mock)
    const paymentIntent = await confirmPaymentWithStripe(clientSecret)
    
    // 7. Complete checkout
    const orderResponse = await completeCheckout(cartId, {
      payment_intent_id: paymentIntent.id
    })
    
    // 8. Verify order
    expect(orderResponse.order.id).toBeDefined()
    expect(orderResponse.order.status).toBe('pending')
    expect(orderResponse.order.payment_status).toBe('captured')
    
    // 9. Verify cart is completed
    await expect(getCart(cartId)).rejects.toThrow('CART_ALREADY_COMPLETED')
    
    // 10. Verify inventory was deducted
    const inventory = await getInventory('variant_fabric_001')
    expect(inventory.available).toBe(initialInventory - 5)
  })
})
```

### Test Data Generators

Custom generators for property-based testing:

```typescript
// Cart creation input generator
const cartCreationInputArbitrary = () => fc.record({
  region_id: fc.constantFrom('reg_us', 'reg_eu', 'reg_uk'),
  currency_code: fc.constantFrom('usd', 'eur', 'gbp'),
  email: fc.option(fc.emailAddress()),
  metadata: fc.option(fc.dictionary(fc.string(), fc.anything()))
})

// Address generator
const addressArbitrary = () => fc.record({
  first_name: fc.string({ minLength: 1, maxLength: 50 }),
  last_name: fc.string({ minLength: 1, maxLength: 50 }),
  address_1: fc.string({ minLength: 5, maxLength: 100 }),
  address_2: fc.option(fc.string({ maxLength: 100 })),
  city: fc.string({ minLength: 2, maxLength: 50 }),
  province: fc.string({ minLength: 2, maxLength: 50 }),
  postal_code: fc.string({ minLength: 3, maxLength: 10 }),
  country_code: fc.constantFrom('us', 'ca', 'gb', 'de', 'fr'),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }))
})

// Line item generator
const lineItemArbitrary = () => fc.record({
  variant_id: fc.uuid(),
  quantity: fc.integer({ min: 1, max: 100 }),
  metadata: fc.option(fc.dictionary(fc.string(), fc.anything()))
})
```

### Test Coverage Goals

- **Unit Tests**: 80% code coverage minimum
- **Integration Tests**: All API endpoints covered
- **Property Tests**: All 49 correctness properties implemented
- **E2E Tests**: All critical user flows covered

### Continuous Testing

- Run unit tests on every commit
- Run integration tests on pull requests
- Run E2E tests before deployment
- Run property tests nightly with extended iterations (1000+)
- Monitor test execution time and optimize slow tests

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Database schema and migrations
- Cart and CartItem models
- CartService with basic CRUD operations
- Unit tests for cart operations

### Phase 2: Cart Management (Week 1-2)
- Line item add/update/remove
- Address management
- Shipping method selection
- Total calculation logic
- Property tests for cart operations

### Phase 3: Payment Integration (Week 2)
- Stripe payment intent creation
- Payment session management
- Webhook endpoint and signature verification
- Payment service unit tests

### Phase 4: Checkout Workflow (Week 3)
- Checkout validation logic
- Order creation from cart
- Idempotency key handling
- Integration tests for checkout flow

### Phase 5: Inventory Management (Week 3)
- Inventory reservation system
- Reservation expiration job
- MOQ validation
- Property tests for inventory

### Phase 6: Notifications & Polish (Week 4)
- Order confirmation emails
- Error handling improvements
- Rate limiting
- E2E tests
- Documentation

### Phase 7: Deployment & Monitoring (Week 4)
- Feature flag configuration
- Production deployment
- Monitoring and alerting setup
- Performance testing
- Gradual rollout

## Security Considerations

### Authentication & Authorization
- JWT token validation for authenticated endpoints
- Email verification for guest order retrieval
- Admin-only endpoints protected by role checks
- Session management for cart ownership

### Payment Security
- Never store credit card numbers
- Use Stripe client-side tokenization
- Verify all webhook signatures
- Implement PCI DSS compliance measures
- Log payment operations for audit

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Sanitize all user inputs
- Implement SQL injection prevention
- Rate limit all endpoints

### Operational Security
- Rotate API keys regularly
- Monitor for suspicious activity
- Implement IP-based rate limiting
- Log all security events
- Set up alerts for anomalies

## Performance Optimization

### Database Optimization
- Index frequently queried fields (cart_id, customer_id, email)
- Use connection pooling
- Implement query result caching
- Optimize N+1 queries with eager loading
- Regular database maintenance

### API Performance
- Implement response caching for product data
- Use pagination for list endpoints
- Compress responses with gzip
- Minimize payload sizes
- Implement request timeouts

### Inventory Performance
- Cache inventory counts
- Batch reservation operations
- Use database transactions for consistency
- Implement optimistic locking
- Background job for expiration cleanup

### Monitoring Metrics
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- Stripe API response times
- Inventory reservation conflicts
- Cart abandonment rates
- Checkout completion rates

## Deployment Strategy

### Feature Flags
```typescript
// Environment variables
USE_NEW_CHECKOUT=true          // Enable new checkout system
ENABLE_LEGACY_CHECKOUT=false   // Disable legacy system
CHECKOUT_ROLLOUT_PERCENTAGE=10 // Gradual rollout percentage
```

### Rollout Plan
1. **Week 1**: Deploy to staging, internal testing
2. **Week 2**: Deploy to production with flag disabled
3. **Week 3**: Enable for 10% of traffic, monitor metrics
4. **Week 4**: Increase to 50% if metrics are good
5. **Week 5**: Full rollout to 100%
6. **Week 6**: Deprecate legacy system

### Rollback Procedure
1. Set USE_NEW_CHECKOUT=false
2. Set ENABLE_LEGACY_CHECKOUT=true
3. Restart application
4. Verify legacy system operational
5. Investigate issues
6. Fix and redeploy

### Monitoring During Rollout
- Compare error rates: new vs legacy
- Compare checkout completion rates
- Monitor payment success rates
- Track inventory conflicts
- Watch for performance degradation
- Collect user feedback

## Dependencies

### External Services
- **Stripe**: Payment processing (v2024-04-10 API)
- **Resend**: Email notifications
- **PostgreSQL**: Database (Neon hosted)
- **Medusa Framework**: v2.10.0

### Internal Modules
- **@medusajs/framework**: Core framework utilities
- **@medusajs/payment-stripe**: Stripe payment provider
- **@medusajs/inventory**: Inventory management module
- **@medusajs/notification**: Notification module
- **resend_notification**: Custom email service

### Development Dependencies
- **fast-check**: Property-based testing
- **jest**: Unit testing framework
- **supertest**: HTTP integration testing
- **@faker-js/faker**: Test data generation

## Appendix

### API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /store/carts | Create new cart |
| GET | /store/carts/:id | Retrieve cart |
| POST | /store/carts/:id/line-items | Add line item |
| PATCH | /store/carts/:id/line-items/:item_id | Update line item |
| DELETE | /store/carts/:id/line-items/:item_id | Remove line item |
| POST | /store/carts/:id/addresses | Set addresses |
| POST | /store/carts/:id/shipping-methods | Set shipping method |
| POST | /store/carts/:id/payment-sessions | Create payment session |
| POST | /store/carts/:id/complete | Complete checkout |
| GET | /store/orders | List customer orders |
| GET | /store/orders/:id | Retrieve order |
| POST | /webhooks/stripe | Process Stripe webhooks |

### Glossary of Terms

- **Cart**: Temporary shopping container
- **Line Item**: Product variant with quantity in cart
- **Payment Intent**: Stripe object representing payment
- **Payment Session**: Link between cart and payment intent
- **Reservation**: Temporary inventory hold
- **Idempotency Key**: Unique identifier for safe retries
- **Webhook**: HTTP callback from external service
- **MOQ**: Minimum Order Quantity
- **Fulfillment**: Physical shipping of order

### References

- [Medusa v2 Documentation](https://docs.medusajs.com/v2)
- [Stripe API Reference](https://stripe.com/docs/api)
- [fast-check Documentation](https://fast-check.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
