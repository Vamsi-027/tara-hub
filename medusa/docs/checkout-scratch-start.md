# Checkout Implementation From Scratch

This document serves as a scaffold for implementing a new, clean checkout flow in Medusa v2. The legacy checkout system has been disabled and can be toggled via the `ENABLE_LEGACY_CHECKOUT` feature flag.

## Current State

### ✅ What's Preserved
- Order storage and retrieval (GET endpoints)
- Admin UI for order management
- Order models and database tables
- Customer management
- Fabric store integration utilities

### ❌ What's Disabled
- Cart creation and management
- Checkout orchestration
- Payment provider integration (Stripe)
- Order creation via cart/checkout flow

## Implementation TODOs

### Phase 1: Core Models & Services

#### TODO 1.1: Define Cart Model
```typescript
// TODO: Create new cart model at src/models/cart.ts
interface Cart {
  id: string
  email?: string
  customer_id?: string
  region_id: string
  currency_code: string
  items: CartItem[]
  shipping_address?: Address
  billing_address?: Address
  metadata?: Record<string, any>
  created_at: Date
  updated_at: Date
}
```

#### TODO 1.2: Create Cart Service
```typescript
// TODO: Implement at src/services/cart.service.ts
class CartService {
  async create(data: CreateCartInput): Promise<Cart>
  async retrieve(id: string): Promise<Cart>
  async update(id: string, data: UpdateCartInput): Promise<Cart>
  async addLineItem(cartId: string, item: LineItem): Promise<Cart>
  async removeLineItem(cartId: string, itemId: string): Promise<Cart>
  async setAddresses(cartId: string, addresses: AddressInput): Promise<Cart>
}
```

#### TODO 1.3: Implement Cart Repository
```typescript
// TODO: Create at src/repositories/cart.repository.ts
class CartRepository {
  // Implement database operations for cart
}
```

### Phase 2: Checkout Flow

#### TODO 2.1: Create Checkout Workflow
```typescript
// TODO: Implement at src/workflows/checkout.workflow.ts
const checkoutWorkflow = createWorkflow({
  name: "checkout-workflow",
  steps: [
    validateCart,
    calculateTotals,
    reserveInventory,
    createPaymentSession,
    authorizePayment,
    createOrder,
    clearCart
  ]
})
```

#### TODO 2.2: Implement Checkout Service
```typescript
// TODO: Create at src/services/checkout.service.ts
class CheckoutService {
  async initiate(cartId: string): Promise<CheckoutSession>
  async setShippingMethod(sessionId: string, methodId: string): Promise<void>
  async setPaymentMethod(sessionId: string, providerId: string): Promise<void>
  async complete(sessionId: string): Promise<Order>
}
```

#### TODO 2.3: Add Validation Rules
```typescript
// TODO: Implement at src/validators/checkout.validator.ts
const checkoutValidators = {
  validateCart: (cart: Cart) => boolean
  validateInventory: (items: CartItem[]) => boolean
  validateShipping: (address: Address) => boolean
  validatePayment: (payment: PaymentInfo) => boolean
}
```

### Phase 3: Payment Integration

#### TODO 3.1: Define Payment Provider Interface
```typescript
// TODO: Create at src/interfaces/payment-provider.interface.ts
interface PaymentProvider {
  createSession(cart: Cart): Promise<PaymentSession>
  authorizePayment(session: PaymentSession): Promise<Payment>
  capturePayment(payment: Payment): Promise<Payment>
  refundPayment(payment: Payment, amount: number): Promise<Refund>
  cancelPayment(payment: Payment): Promise<void>
}
```

#### TODO 3.2: Implement Stripe Provider
```typescript
// TODO: Create at src/providers/stripe.provider.ts
class StripePaymentProvider implements PaymentProvider {
  // Implement Stripe-specific payment logic
}
```

#### TODO 3.3: Add Webhook Handler
```typescript
// TODO: Implement at src/api/webhooks/stripe/route.ts
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  // Handle Stripe webhooks for payment events
}
```

### Phase 4: API Routes

#### TODO 4.1: Cart Management Routes
```typescript
// TODO: Implement cart routes at src/api/store/carts/
POST   /store/carts           // Create cart
GET    /store/carts/:id       // Get cart
POST   /store/carts/:id       // Update cart
DELETE /store/carts/:id       // Delete cart
POST   /store/carts/:id/line-items     // Add item
DELETE /store/carts/:id/line-items/:id // Remove item
```

#### TODO 4.2: Checkout Routes
```typescript
// TODO: Implement checkout routes at src/api/store/checkout/
POST /store/checkout/:cartId/email          // Set email
POST /store/checkout/:cartId/shipping       // Set shipping
POST /store/checkout/:cartId/payment        // Set payment
POST /store/checkout/:cartId/complete       // Complete checkout
```

#### TODO 4.3: Payment Routes
```typescript
// TODO: Implement payment routes at src/api/store/payments/
POST /store/payments/sessions     // Create payment session
POST /store/payments/authorize    // Authorize payment
POST /store/payments/capture      // Capture payment
```

### Phase 5: Testing

#### TODO 5.1: Unit Tests
```typescript
// TODO: Create test files
src/services/__tests__/cart.service.test.ts
src/services/__tests__/checkout.service.test.ts
src/workflows/__tests__/checkout.workflow.test.ts
```

#### TODO 5.2: Integration Tests
```typescript
// TODO: Create integration tests
src/api/__tests__/cart-routes.test.ts
src/api/__tests__/checkout-routes.test.ts
src/api/__tests__/payment-routes.test.ts
```

#### TODO 5.3: E2E Tests
```typescript
// TODO: Create end-to-end test scenarios
tests/e2e/complete-checkout.test.ts
tests/e2e/payment-failures.test.ts
tests/e2e/inventory-reservation.test.ts
```

### Phase 6: Migration & Cleanup

#### TODO 6.1: Data Migration
```sql
-- TODO: Create migration scripts
-- Migrate existing cart data if needed
-- Update order references
-- Clean up deprecated tables
```

#### TODO 6.2: Remove Legacy Code
```typescript
// TODO: After new implementation is stable
// 1. Remove feature flag checks
// 2. Delete deprecated routes
// 3. Remove old middleware
// 4. Clean up unused dependencies
```

#### TODO 6.3: Documentation
```markdown
// TODO: Create documentation
docs/api/cart.md
docs/api/checkout.md
docs/api/payments.md
docs/guides/checkout-customization.md
```

## Implementation Guidelines

### Best Practices
1. **Use Medusa v2 Workflows**: Leverage the workflow system for complex operations
2. **Maintain Backward Compatibility**: Ensure existing orders remain accessible
3. **Implement Idempotency**: Make checkout operations idempotent
4. **Add Comprehensive Logging**: Log all critical operations for debugging
5. **Handle Edge Cases**: Network failures, payment timeouts, inventory conflicts

### Security Considerations
1. **Validate All Input**: Sanitize and validate all user input
2. **Implement Rate Limiting**: Prevent abuse of checkout endpoints
3. **Secure Payment Data**: Never store sensitive payment information
4. **Use HTTPS Only**: Ensure all payment operations use HTTPS
5. **Implement CSRF Protection**: Add CSRF tokens to forms

### Performance Optimization
1. **Cache Cart Data**: Use Redis for cart session storage
2. **Optimize Database Queries**: Add appropriate indexes
3. **Implement Queue System**: Use queues for async operations
4. **Add Response Caching**: Cache product and pricing data
5. **Monitor Performance**: Add metrics and monitoring

## Testing Checklist

Before enabling the new checkout:

- [ ] All unit tests pass
- [ ] Integration tests cover happy path
- [ ] Edge cases are tested
- [ ] Payment flows work correctly
- [ ] Inventory is properly managed
- [ ] Orders are created successfully
- [ ] Admin can view new orders
- [ ] Webhooks are processed correctly
- [ ] Performance meets requirements
- [ ] Security audit completed

## Rollout Plan

1. **Development Environment**
   - Implement core functionality
   - Run all tests
   - Fix any issues

2. **Staging Environment**
   - Deploy with feature flag disabled
   - Enable for internal testing
   - Run load tests

3. **Production Rollout**
   - Deploy with feature flag disabled
   - Enable for small percentage of users
   - Monitor metrics and errors
   - Gradually increase rollout
   - Full deployment when stable

## Support & Resources

### Medusa Documentation
- [Workflows](https://docs.medusajs.com/v2/resources/workflows)
- [Services](https://docs.medusajs.com/v2/resources/services)
- [API Routes](https://docs.medusajs.com/v2/resources/api-routes)
- [Payment Providers](https://docs.medusajs.com/v2/resources/payment)

### Example Implementations
- [Medusa Starter](https://github.com/medusajs/medusa-starter-default)
- [Next.js Starter](https://github.com/medusajs/nextjs-starter-medusa)

### Getting Help
- Medusa Discord Community
- GitHub Issues
- Stack Overflow (#medusajs)

## Notes

This is a living document. Update it as you implement each section. Remove TODOs as they're completed and add any learnings or gotchas discovered during implementation.