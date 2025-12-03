# Implementation Plan: Medusa Cart/Checkout Restoration

This implementation plan breaks down the cart/checkout restoration into discrete, actionable coding tasks. Each task builds incrementally on previous work, with property-based tests integrated throughout to catch issues early.

## Task List

- [ ] 1. Set up database schema and migrations
  - Create migration files for carts, cart_items, payment_sessions, inventory_reservations, and idempotency_keys tables
  - Add indexes for performance optimization (cart_id, customer_id, email, expires_at)
  - Run migrations in development environment
  - _Requirements: 1.1, 4.1, 6.1, 13.1_

- [ ] 2. Implement Cart data models and repository
  - [ ] 2.1 Create Cart and CartItem TypeScript interfaces in `medusa/src/models/cart.ts`
    - Define Cart model with all fields (id, email, customer_id, region_id, currency_code, items, addresses, totals, metadata, timestamps)
    - Define CartItem model with fields (id, cart_id, variant_id, product_id, title, quantity, prices, metadata)
    - _Requirements: 1.1, 1.2_

  - [ ] 2.2 Implement CartRepository in `medusa/src/repositories/cart.repository.ts`
    - Implement create, findById, update, delete methods
    - Implement findByCustomerId and findByEmail for order retrieval
    - Implement findExpired for cleanup job
    - _Requirements: 1.1, 1.5, 14.1_

  - [ ] 2.3 Write property test for cart creation
    - **Property 1: Cart Creation Completeness**
    - **Validates: Requirements 1.1**

- [ ] 3. Implement CartService with core operations
  - [ ] 3.1 Create CartService in `medusa/src/services/cart.service.ts`
    - Implement create() method with region and currency validation
    - Implement retrieve() method with error handling for not found
    - Implement update() method for cart metadata
    - Implement delete() method
    - _Requirements: 1.1, 1.5_

  - [ ] 3.2 Implement line item management methods
    - Implement addLineItem() with variant validation and MOQ checking
    - Implement updateLineItem() with quantity validation and MOQ checking
    - Implement removeLineItem() with cart recalculation
    - _Requirements: 1.2, 1.3, 1.4, 7.1, 7.2_

  - [ ] 3.3 Write property tests for line item operations
    - **Property 2: Line Item Addition**
    - **Property 3: Total Recalculation on Update**
    - **Property 4: Line Item Removal Invariant**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [ ] 3.4 Write property test for cart retrieval
    - **Property 5: Cart Retrieval Round-Trip**
    - **Validates: Requirements 1.5**

- [ ] 4. Implement totals calculation logic
  - [ ] 4.1 Create TotalsCalculator utility in `medusa/src/utils/totals-calculator.ts`
    - Implement calculateSubtotal() for sum of line items
    - Implement calculateTax() based on region tax rates and address
    - Implement calculateShipping() based on selected method
    - Implement calculateTotal() combining all components
    - _Requirements: 1.3, 2.5, 3.2_

  - [ ] 4.2 Write unit tests for totals calculation
    - Test subtotal calculation with multiple items
    - Test tax calculation with different rates
    - Test shipping cost application
    - Test total calculation accuracy
    - _Requirements: 1.3_

- [ ] 5. Implement address management
  - [ ] 5.1 Create Address model and validation in `medusa/src/models/address.ts`
    - Define Address interface with all required fields
    - Implement validateAddress() function with field-level validation
    - Implement validateShippingAddress() with region-specific rules
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 5.2 Add address methods to CartService
    - Implement setShippingAddress() with validation and totals recalculation
    - Implement setBillingAddress() with validation
    - Implement billing address defaulting logic (use shipping if not provided)
    - Implement address change handler that clears shipping method
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.4_

  - [ ] 5.3 Write property tests for address management
    - **Property 6: Address Validation Consistency**
    - **Property 7: Billing Address Defaulting**
    - **Property 8: Address Change Triggers Recalculation**
    - **Property 12: Address Change Clears Shipping**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 3.4**

- [ ] 6. Implement shipping method selection
  - [ ] 6.1 Create ShippingService in `medusa/src/services/shipping.service.ts`
    - Implement getAvailableMethods() filtered by region and address
    - Implement validateShippingMethod() for region compatibility
    - _Requirements: 3.1, 3.3_

  - [ ] 6.2 Add shipping method to CartService
    - Implement setShippingMethod() with validation and totals recalculation
    - _Requirements: 3.2_

  - [ ] 6.3 Write property tests for shipping
    - **Property 9: Shipping Method Filtering**
    - **Property 10: Shipping Method Selection Updates Totals**
    - **Property 11: Shipping Method Region Validation**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 7. Implement Stripe payment integration
  - [ ] 7.1 Create PaymentService in `medusa/src/services/payment.service.ts`
    - Initialize Stripe client with API key from environment
    - Implement createPaymentIntent() with cart total and metadata
    - Implement retrievePaymentIntent() for status checking
    - Implement confirmPaymentIntent() for verification
    - Implement cancelPaymentIntent() for cleanup
    - _Requirements: 4.1, 4.2, 5.1_

  - [ ] 7.2 Create PaymentSession model and repository
    - Define PaymentSession interface in `medusa/src/models/payment-session.ts`
    - Implement PaymentSessionRepository in `medusa/src/repositories/payment-session.repository.ts`
    - _Requirements: 4.1_

  - [ ] 7.3 Add payment session methods to CartService
    - Implement createPaymentSession() that creates Stripe payment intent and stores session
    - Implement updatePaymentSession() for saved payment methods
    - Handle payment session failures without cart side effects
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 7.4 Write property tests for payment sessions
    - **Property 13: Payment Intent Amount Accuracy**
    - **Property 14: Payment Intent Metadata Correlation**
    - **Property 15: Payment Session Response Completeness**
    - **Property 16: Payment Session Failure Isolation**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 8. Implement idempotency key handling
  - [ ] 8.1 Create IdempotencyService in `medusa/src/services/idempotency.service.ts`
    - Implement checkKey() to retrieve existing results
    - Implement storeKey() to save operation results
    - Implement detectConflict() for key reuse with different data
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 8.2 Add idempotency middleware in `medusa/src/middleware/idempotency.middleware.ts`
    - Extract idempotency key from X-Idempotency-Key header
    - Check for existing results before processing
    - Store results after successful processing
    - _Requirements: 13.1, 13.2, 13.3_

  - [ ] 8.3 Write property tests for idempotency
    - **Property 17: Payment Session Idempotency**
    - **Property 43: Idempotency Key Consistency**
    - **Property 44: Idempotency Key Conflict Detection**
    - **Validates: Requirements 4.5, 13.1, 13.2, 13.3, 13.4**

- [ ] 9. Implement inventory reservation system
  - [ ] 9.1 Create InventoryReservation model and repository
    - Define InventoryReservation interface in `medusa/src/models/inventory-reservation.ts`
    - Implement InventoryReservationRepository in `medusa/src/repositories/inventory-reservation.repository.ts`
    - Add methods: create, findByCartId, findExpired, delete
    - _Requirements: 6.1, 6.2_

  - [ ] 9.2 Create InventoryService in `medusa/src/services/inventory.service.ts`
    - Implement checkAvailability() to verify stock levels
    - Implement createReservation() with 15-minute expiration
    - Implement releaseReservation() to free inventory
    - Implement convertReservationToDeduction() for order completion
    - Integrate with Medusa's @medusajs/inventory module
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ] 9.3 Create inventory expiration background job
    - Implement expireReservations() job in `medusa/src/jobs/expire-reservations.job.ts`
    - Schedule job to run every 5 minutes using cron
    - Query for expired reservations and release them
    - _Requirements: 6.3_

  - [ ] 9.4 Write property tests for inventory
    - **Property 23: Inventory Reservation on Payment Session**
    - **Property 24: Reservation Expiration Time**
    - **Property 25: Automatic Reservation Release**
    - **Property 26: Reservation to Deduction Conversion**
    - **Property 27: Immediate Reservation Release on Failure**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [ ] 10. Implement MOQ validation
  - [ ] 10.1 Create ValidationService in `medusa/src/services/validation.service.ts`
    - Implement validateMinimumOrderQuantity() checking product MOQ metadata
    - Implement validateCart() for comprehensive cart validation
    - Implement validateLineItems() for all items in cart
    - Return structured ValidationResult with specific errors
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 10.2 Integrate MOQ validation into CartService
    - Add MOQ check in addLineItem() before adding
    - Add MOQ check in updateLineItem() before updating
    - Add MOQ validation in payment session creation
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 10.3 Write property tests for MOQ validation
    - **Property 28: MOQ Validation on Add/Update**
    - **Property 29: MOQ Validation at Checkout**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [ ] 11. Implement checkout completion workflow
  - [ ] 11.1 Create CheckoutService in `medusa/src/services/checkout.service.ts`
    - Implement validateCart() checking all cart requirements
    - Implement validateInventory() checking stock availability
    - Implement validatePayment() verifying Stripe payment intent status
    - Implement complete() orchestrating the full checkout workflow
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 11.2 Implement Order creation logic
    - Create Order model in `medusa/src/models/order.ts`
    - Implement OrderRepository in `medusa/src/repositories/order.repository.ts`
    - Implement createOrderFromCart() copying all cart data to order
    - Generate display_id for customer-facing order number
    - _Requirements: 5.2_

  - [ ] 11.3 Implement checkout workflow steps
    - Step 1: Validate cart completeness (items, addresses, shipping, payment)
    - Step 2: Validate inventory availability
    - Step 3: Verify payment with Stripe
    - Step 4: Create order record
    - Step 5: Convert inventory reservations to deductions
    - Step 6: Mark cart as completed
    - Step 7: Trigger order confirmation email
    - Add error handling and compensation logic (release inventory on failure)
    - _Requirements: 5.1, 5.2, 5.3, 6.4_

  - [ ] 11.4 Write property tests for checkout
    - **Property 18: Checkout Requires Payment Verification**
    - **Property 19: Order Data Completeness**
    - **Property 20: Cart Completion Immutability**
    - **Property 21: Checkout Cart-Level Idempotency**
    - **Property 22: Checkout Request-Level Idempotency**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [ ] 12. Implement Stripe webhook handler
  - [ ] 12.1 Update webhook route in `medusa/src/api/webhooks/stripe/route.ts`
    - Implement webhook signature verification using Stripe library
    - Add idempotency check using event.id to prevent duplicate processing
    - Route events to appropriate handlers
    - Return 200 for all events (even errors) to prevent retries
    - _Requirements: 8.1, 8.5_

  - [ ] 12.2 Implement webhook event handlers
    - Implement handlePaymentIntentSucceeded() updating order payment status
    - Implement handlePaymentIntentFailed() updating status and releasing inventory
    - Implement handlePaymentIntentCanceled() canceling order
    - Implement handleChargeRefunded() updating refund status
    - Implement handleDisputeCreated() logging dispute information
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ] 12.3 Write property tests for webhook processing
    - **Property 30: Webhook Signature Verification**
    - **Property 31: Payment Success Event Handling**
    - **Property 32: Payment Failure Event Handling**
    - **Property 33: Refund Event Handling**
    - **Property 34: Webhook Error Resilience**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 13. Implement order confirmation notifications
  - [ ] 13.1 Create order confirmation email template
    - Design HTML email template with order details
    - Include order number, items, totals, shipping address
    - Add tracking information placeholder for future use
    - _Requirements: 9.2_

  - [ ] 13.2 Integrate with Resend notification service
    - Create order.placed event subscriber in `medusa/src/subscribers/order-placed.ts`
    - Trigger email sending when order is created
    - Handle email failures gracefully without blocking order creation
    - Log email sending results
    - _Requirements: 9.1, 9.3_

  - [ ] 13.3 Write property tests for notifications
    - **Property 35: Order Confirmation Email Trigger**
    - **Property 36: Email Content Completeness**
    - **Property 37: Email Failure Non-Blocking**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [ ] 14. Implement order retrieval endpoints
  - [ ] 14.1 Create order routes in `medusa/src/api/store/orders/route.ts`
    - Implement GET /store/orders for authenticated customers
    - Implement GET /store/orders/:id for guest and authenticated access
    - Add email verification for guest order retrieval
    - Add pagination for order list
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 14.2 Write property tests for order retrieval
    - **Property 38: Authenticated Order Filtering**
    - **Property 39: Guest Order Email Authorization**
    - **Property 40: Order Retrieval Completeness**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [ ] 15. Implement cart API routes
  - [ ] 15.1 Create cart routes in `medusa/src/api/store/carts/route.ts`
    - Implement POST /store/carts for cart creation
    - Implement GET /store/carts/:id for cart retrieval
    - Add idempotency middleware to POST endpoint
    - _Requirements: 1.1, 1.5_

  - [ ] 15.2 Create line item routes in `medusa/src/api/store/carts/[id]/line-items/route.ts`
    - Implement POST /store/carts/:id/line-items for adding items
    - Implement PATCH /store/carts/:id/line-items/:item_id for updating quantity
    - Implement DELETE /store/carts/:id/line-items/:item_id for removing items
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ] 15.3 Create address routes in `medusa/src/api/store/carts/[id]/addresses/route.ts`
    - Implement POST /store/carts/:id/addresses for setting shipping and billing addresses
    - _Requirements: 2.1, 2.2_

  - [ ] 15.4 Create shipping method routes in `medusa/src/api/store/carts/[id]/shipping-methods/route.ts`
    - Implement GET /store/carts/:id/shipping-methods for available methods
    - Implement POST /store/carts/:id/shipping-methods for selecting method
    - _Requirements: 3.1, 3.2_

  - [ ] 15.5 Create payment session routes in `medusa/src/api/store/carts/[id]/payment-sessions/route.ts`
    - Implement POST /store/carts/:id/payment-sessions for creating payment session
    - Add idempotency middleware
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 15.6 Create checkout completion route in `medusa/src/api/store/carts/[id]/complete/route.ts`
    - Implement POST /store/carts/:id/complete for checkout completion
    - Add idempotency middleware
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 16. Implement error handling and validation
  - [ ] 16.1 Create error response utilities in `medusa/src/utils/error-response.ts`
    - Define ErrorResponse interface with code, message, field, details
    - Implement formatError() for consistent error formatting
    - Implement error code constants (CART_NOT_FOUND, INSUFFICIENT_INVENTORY, etc.)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ] 16.2 Add error handling middleware in `medusa/src/middleware/error-handler.middleware.ts`
    - Catch all unhandled errors
    - Log full error details internally
    - Return sanitized error messages to clients
    - Map error types to appropriate HTTP status codes
    - _Requirements: 12.5_

  - [ ] 16.3 Write property tests for error handling
    - **Property 41: Error Response Structure**
    - **Property 42: Error Detail Security**
    - **Property 49: Malformed Input Rejection**
    - **Validates: Requirements 12.1, 12.5, 15.4**

- [ ] 17. Implement cart expiration
  - [ ] 17.1 Create cart expiration job in `medusa/src/jobs/expire-carts.job.ts`
    - Query for carts older than 7 days that are not completed
    - Mark carts as expired
    - Schedule job to run daily using cron
    - _Requirements: 14.1_

  - [ ] 17.2 Add expiration check to cart retrieval
    - Check expires_at timestamp when retrieving cart
    - Return CART_EXPIRED error if expired
    - Prevent operations on expired carts
    - _Requirements: 14.2_

  - [ ] 17.3 Implement expiration immunity for completed carts
    - Exclude completed carts from expiration job
    - Set completed_at timestamp on checkout completion
    - _Requirements: 14.3_

  - [ ] 17.4 Write property tests for cart expiration
    - **Property 45: Cart Expiration Processing**
    - **Property 46: Completed Cart Expiration Immunity**
    - **Validates: Requirements 14.1, 14.3**

- [ ] 18. Implement rate limiting
  - [ ] 18.1 Create rate limiting middleware in `medusa/src/middleware/rate-limit.middleware.ts`
    - Implement IP-based rate limiting using in-memory store (or Redis if available)
    - Configure limits: 10/min for cart creation, 5/min for checkout
    - Return 429 status code when limit exceeded
    - _Requirements: 15.1, 15.2_

  - [ ] 18.2 Apply rate limiting to endpoints
    - Add rate limiter to POST /store/carts
    - Add rate limiter to POST /store/carts/:id/complete
    - Configure different limits per endpoint
    - _Requirements: 15.1, 15.2_

  - [ ] 18.3 Write property tests for rate limiting
    - **Property 47: Rate Limiting Enforcement**
    - **Property 48: Checkout Rate Limiting**
    - **Validates: Requirements 15.1, 15.2**

- [ ] 19. Implement feature flags
  - [ ] 19.1 Create feature flag configuration in `medusa/medusa-config.ts`
    - Read USE_NEW_CHECKOUT environment variable
    - Read ENABLE_LEGACY_CHECKOUT environment variable
    - Configure Stripe module based on flags
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 19.2 Add feature flag middleware in `medusa/src/middleware/feature-flag.middleware.ts`
    - Check USE_NEW_CHECKOUT flag for new endpoints
    - Return 404 if flag is disabled
    - Allow both systems when both flags enabled
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 20. Write integration tests
  - [ ] 20.1 Write integration tests for cart API
    - Test complete cart creation flow
    - Test line item management
    - Test address and shipping selection
    - Test error cases (not found, validation failures)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2_

  - [ ] 20.2 Write integration tests for checkout API
    - Test payment session creation
    - Test checkout completion with valid payment
    - Test checkout failure scenarios
    - Test idempotency behavior
    - _Requirements: 4.1, 5.1, 5.2, 13.1_

  - [ ] 20.3 Write integration tests for webhook processing
    - Test webhook signature verification
    - Test payment success handling
    - Test payment failure handling
    - Test refund handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 21. Write end-to-end tests
  - [ ] 21.1 Write E2E test for guest checkout flow
    - Create cart → Add items → Set addresses → Select shipping → Create payment → Complete checkout
    - Verify order creation and cart completion
    - Verify inventory deduction
    - Verify email sent
    - _Requirements: All requirements_

  - [ ] 21.2 Write E2E test for authenticated checkout flow
    - Login → Create cart → Checkout → Retrieve order
    - Verify customer association
    - _Requirements: 1.1, 5.2, 10.1_

  - [ ] 21.3 Write E2E test for payment failure recovery
    - Create cart → Payment fails → Retry → Success
    - Verify inventory released on failure
    - Verify inventory deducted on success
    - _Requirements: 6.5, 8.3_

  - [ ] 21.4 Write E2E test for inventory reservation conflicts
    - Two users → Same product → Limited stock → First succeeds, second fails
    - Verify reservation prevents overselling
    - _Requirements: 6.1, 6.2_

- [ ] 22. Add logging and monitoring
  - [ ] 22.1 Implement structured logging
    - Add logging to all service methods
    - Include request_id, cart_id, customer_id in log context
    - Log all errors with full stack traces
    - Log performance metrics (operation duration)
    - _Requirements: 12.5_

  - [ ] 22.2 Add monitoring metrics
    - Track cart creation rate
    - Track checkout completion rate
    - Track payment success/failure rates
    - Track inventory reservation conflicts
    - Track API response times
    - _Requirements: All requirements_

- [ ] 23. Create documentation
  - [ ] 23.1 Write API documentation
    - Document all endpoints with request/response examples
    - Document error codes and meanings
    - Document idempotency key usage
    - Document rate limits
    - _Requirements: All requirements_

  - [ ] 23.2 Write deployment guide
    - Document environment variables
    - Document database migration steps
    - Document feature flag configuration
    - Document rollback procedure
    - _Requirements: 11.1, 11.2_

  - [ ] 23.3 Write operational runbook
    - Document monitoring and alerting
    - Document common issues and solutions
    - Document Stripe webhook troubleshooting
    - Document inventory management
    - _Requirements: All requirements_

- [ ] 24. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify 100% pass rate
  - Run all property tests with 100 iterations
  - Run all integration tests
  - Run all E2E tests
  - Verify code coverage meets 80% minimum
  - Ask the user if questions arise
  - _Requirements: All requirements_

- [ ] 25. Deploy to staging environment
  - [ ] 25.1 Configure staging environment
    - Set up environment variables
    - Configure Stripe test mode keys
    - Set up test database
    - Configure feature flags (USE_NEW_CHECKOUT=true)
    - _Requirements: 11.1_

  - [ ] 25.2 Run database migrations
    - Execute migration scripts
    - Verify all tables created
    - Verify indexes created
    - _Requirements: 1.1_

  - [ ] 25.3 Deploy application
    - Build application
    - Deploy to staging server
    - Verify application starts successfully
    - Verify health check endpoint
    - _Requirements: All requirements_

  - [ ] 25.4 Run smoke tests
    - Test cart creation
    - Test checkout flow
    - Test webhook processing
    - Verify Stripe integration
    - _Requirements: All requirements_

- [ ] 26. Production deployment preparation
  - [ ] 26.1 Configure production environment
    - Set up production environment variables
    - Configure Stripe live mode keys
    - Set up production database
    - Configure monitoring and alerting
    - Set feature flags (USE_NEW_CHECKOUT=false initially)
    - _Requirements: 11.1, 11.4_

  - [ ] 26.2 Create deployment checklist
    - Database backup procedure
    - Rollback procedure
    - Monitoring dashboard setup
    - Alert configuration
    - On-call rotation
    - _Requirements: All requirements_

  - [ ] 26.3 Deploy to production with flag disabled
    - Deploy application code
    - Verify deployment successful
    - Verify legacy system still operational
    - Monitor for any issues
    - _Requirements: 11.2, 11.4_

- [ ] 27. Gradual rollout
  - [ ] 27.1 Enable for 10% of traffic
    - Set USE_NEW_CHECKOUT=true
    - Configure rollout percentage to 10%
    - Monitor error rates and performance
    - Compare metrics with legacy system
    - _Requirements: 11.1_

  - [ ] 27.2 Increase to 50% if metrics are good
    - Verify no increase in errors
    - Verify checkout completion rate maintained
    - Increase rollout to 50%
    - Continue monitoring
    - _Requirements: 11.1_

  - [ ] 27.3 Full rollout to 100%
    - Verify system stability at 50%
    - Increase to 100%
    - Monitor for 48 hours
    - Disable legacy system (ENABLE_LEGACY_CHECKOUT=false)
    - _Requirements: 11.1, 11.2_

## Notes

- All property-based tests should run a minimum of 100 iterations
- Each property test must include a comment tag referencing the design document property number
- All tests (unit, property, integration, E2E) are required for comprehensive coverage
- Tasks should be executed in order as they build on each other
- Checkpoint tasks (24) should be used to verify system stability before proceeding
- Feature flags allow safe deployment and easy rollback if issues arise
- Property-based tests use fast-check library with custom generators for domain objects
- All tests must pass before deployment to staging or production
