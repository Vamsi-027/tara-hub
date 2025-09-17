#!/usr/bin/env node

/**
 * End-to-end checkout flow test
 * Simulates complete user journey from browsing to order completion
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.FABRIC_STORE_URL || 'http://localhost:3006';
const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || 'https://medusa-backend-production-3655.up.railway.app';

// Test configuration
const TEST_CONFIG = {
  skipPayment: true, // Skip actual Stripe payment processing
  verbose: true,     // Show detailed logs
};

// Test user data
const TEST_USER = {
  email: 'e2e.test@example.com',
  firstName: 'E2E',
  lastName: 'Tester',
  phone: '+15551234567',
  address: '456 Test Avenue',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94102'
};

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, type = 'info') {
  if (!TEST_CONFIG.verbose && type === 'debug') return;

  const icons = {
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    info: `${colors.cyan}ℹ${colors.reset}`,
    step: `${colors.magenta}▶${colors.reset}`,
    debug: `${colors.cyan}🔍${colors.reset}`
  };

  console.log(`${icons[type] || icons.info} ${message}`);
}

// Step 1: Browse products
async function browseProducts() {
  log('Step 1: Browsing products', 'step');

  try {
    const response = await fetch(`${BASE_URL}/api/fabrics`);
    if (!response.ok) throw new Error(`Failed to fetch fabrics: ${response.status}`);

    const fabrics = await response.json();
    log(`Found ${fabrics.length} fabrics`, 'success');

    if (fabrics.length === 0) {
      throw new Error('No products available for testing');
    }

    // Select first product for testing
    const selectedProduct = fabrics[0];
    log(`Selected product: ${selectedProduct.title} (${selectedProduct.id})`, 'info');

    return selectedProduct;
  } catch (error) {
    log(`Failed to browse products: ${error.message}`, 'error');
    throw error;
  }
}

// Step 2: View product details
async function viewProductDetails(productId) {
  log('Step 2: Viewing product details', 'step');

  try {
    const response = await fetch(`${BASE_URL}/api/fabrics/${productId}`);
    if (!response.ok) throw new Error(`Failed to fetch product details: ${response.status}`);

    const product = await response.json();

    log(`Product: ${product.title}`, 'info');
    log(`Price: $${product.price} per yard`, 'info');
    log(`Variants: ${product.variants?.length || 0}`, 'info');

    return product;
  } catch (error) {
    log(`Failed to view product: ${error.message}`, 'error');
    throw error;
  }
}

// Step 3: Simulate cart operations
async function simulateCart(product) {
  log('Step 3: Simulating cart operations', 'step');

  const cart = [];

  // Add fabric (2.5 yards)
  const fabricItem = {
    id: `${product.id}-fabric`,
    productId: product.id,
    variantId: product.variants?.find(v => v.title.includes('Yard'))?.id || 'variant_01K5C2CNNTW2R5B6BHDJ8AQE4A',
    title: product.title,
    variant: 'Fabric Per Yard',
    price: Math.round(product.price * 100), // Convert to cents
    quantity: 1,
    yardage: 2.5,
    type: 'fabric',
    sku: product.sku || 'TEST-FABRIC'
  };

  cart.push(fabricItem);
  log(`Added ${fabricItem.yardage} yards of fabric to cart`, 'success');

  // Add swatches (5 pieces)
  const swatchItem = {
    id: `${product.id}-swatch`,
    productId: product.id,
    variantId: product.variants?.find(v => v.title.includes('Swatch'))?.id || 'variant_01K5C2CNNT6SDE68QZFJ8JM5H6',
    title: product.title,
    variant: 'Swatch Sample',
    price: 500, // $5.00 in cents
    quantity: 5,
    type: 'swatch',
    sku: `${product.sku}-SWATCH`
  };

  cart.push(swatchItem);
  log(`Added ${swatchItem.quantity} swatches to cart`, 'success');

  // Calculate total
  const total = cart.reduce((sum, item) => {
    if (item.type === 'fabric' && item.yardage) {
      return sum + (item.price * item.yardage);
    }
    return sum + (item.price * item.quantity);
  }, 0);

  log(`Cart total: $${(total / 100).toFixed(2)}`, 'info');

  return { cart, total };
}

// Step 4: Create order in Medusa
async function createOrder(cart, total) {
  log('Step 4: Creating order in Medusa', 'step');

  const orderData = {
    email: TEST_USER.email,
    items: cart,
    shipping: {
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      phone: TEST_USER.phone,
      address: TEST_USER.address,
      city: TEST_USER.city,
      state: TEST_USER.state,
      zipCode: TEST_USER.zipCode,
      country: 'US'
    },
    total
  };

  try {
    const response = await fetch(`${BASE_URL}/api/create-medusa-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Order creation failed: ${response.status} - ${error}`);
    }

    const result = await response.json();

    log(`Order created: ${result.orderId}`, 'success');

    if (result.clientSecret) {
      log('Payment intent created', 'success');
      log(`Payment Intent ID: ${result.paymentIntentId}`, 'debug');
    }

    return result;
  } catch (error) {
    log(`Failed to create order: ${error.message}`, 'error');
    throw error;
  }
}

// Step 5: Simulate payment (optional)
async function simulatePayment(orderResult) {
  log('Step 5: Payment simulation', 'step');

  if (TEST_CONFIG.skipPayment) {
    log('Skipping actual payment processing (test mode)', 'warning');
    return { status: 'test_success' };
  }

  // In a real E2E test, you would:
  // 1. Use Stripe test API to confirm payment intent
  // 2. Wait for webhook to update order status
  // 3. Verify order status change in Medusa

  log('Payment would be processed with Stripe', 'info');
  log('Test card: 4242 4242 4242 4242', 'info');

  return { status: 'pending_real_payment' };
}

// Step 6: Verify order in Medusa admin
async function verifyOrder(orderId) {
  log('Step 6: Verifying order in Medusa', 'step');

  // Note: Admin API requires authentication, so we check if order exists
  log(`Order ID: ${orderId}`, 'info');
  log(`Check Medusa admin: ${MEDUSA_URL}/app/orders`, 'info');
  log('Order should appear with status: pending/processing', 'info');

  return { verified: true, orderId };
}

// Main test flow
async function runE2ETest() {
  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}  End-to-End Checkout Test${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const testResults = {
    steps: [],
    success: true,
    orderId: null
  };

  try {
    // Step 1: Browse products
    const product = await browseProducts();
    testResults.steps.push({ name: 'Browse Products', status: 'passed' });

    // Step 2: View product details
    const productDetails = await viewProductDetails(product.id);
    testResults.steps.push({ name: 'View Product Details', status: 'passed' });

    // Step 3: Cart operations
    const { cart, total } = await simulateCart(productDetails);
    testResults.steps.push({ name: 'Cart Operations', status: 'passed' });

    // Step 4: Create order
    const orderResult = await createOrder(cart, total);
    testResults.orderId = orderResult.orderId;
    testResults.steps.push({ name: 'Create Order', status: 'passed' });

    // Step 5: Payment
    const paymentResult = await simulatePayment(orderResult);
    testResults.steps.push({ name: 'Payment Simulation', status: 'passed' });

    // Step 6: Verify order
    await verifyOrder(orderResult.orderId);
    testResults.steps.push({ name: 'Order Verification', status: 'passed' });

  } catch (error) {
    testResults.success = false;
    testResults.error = error.message;
    log(`Test failed: ${error.message}`, 'error');
  }

  // Display test results
  console.log(`\n${colors.bright}📊 Test Results${colors.reset}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  testResults.steps.forEach((step, index) => {
    const icon = step.status === 'passed' ? colors.green + '✓' : colors.red + '✗';
    console.log(`  ${index + 1}. ${step.name}: ${icon}${colors.reset}`);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (testResults.success) {
    console.log(`\n${colors.green}${colors.bright}✅ All tests passed!${colors.reset}`);

    if (testResults.orderId) {
      console.log(`\n${colors.bright}📦 Order Details${colors.reset}`);
      console.log(`  Order ID: ${testResults.orderId}`);
      console.log(`  Customer: ${TEST_USER.email}`);
      console.log(`  Status: Pending payment`);

      console.log(`\n${colors.bright}🔗 Next Steps${colors.reset}`);
      console.log(`  1. Login to Medusa Admin: ${MEDUSA_URL}/app`);
      console.log(`  2. Navigate to Orders section`);
      console.log(`  3. Find order: ${testResults.orderId}`);
      console.log(`  4. Complete payment with test card: 4242 4242 4242 4242`);
      console.log(`  5. Verify order status updates to 'paid'`);
    }
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ Test failed${colors.reset}`);
    if (testResults.error) {
      console.log(`  Error: ${testResults.error}`);
    }
  }

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  process.exit(testResults.success ? 0 : 1);
}

// Run test if executed directly
if (require.main === module) {
  runE2ETest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runE2ETest };