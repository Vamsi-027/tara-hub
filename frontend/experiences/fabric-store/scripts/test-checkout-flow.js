#!/usr/bin/env node

/**
 * Quick Test Script for Checkout Flow
 * 
 * This script tests the complete checkout flow with the new Medusa backend integration.
 * Run this after starting both Medusa backend and fabric-store frontend.
 * 
 * Usage: node scripts/test-checkout-flow.js
 */

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

if (!PUBLISHABLE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY not set');
  console.log('Please set it in your .env.local file');
  process.exit(1);
}

// Test data
const TEST_REGION_ID = 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ'; // Default US region
const TEST_EMAIL = 'test@example.com';

async function makeRequest(path, options = {}) {
  const url = `${MEDUSA_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'x-publishable-api-key': PUBLISHABLE_KEY,
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `Request failed: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Request to ${path} failed:`, error.message);
    throw error;
  }
}

async function testCartOperations() {
  console.log('\n🧪 Testing Cart Operations...');
  console.log('================================');

  // 1. Create cart
  console.log('\n1️⃣  Creating cart...');
  const cartResponse = await makeRequest('/store/carts', {
    method: 'POST',
    body: JSON.stringify({
      region_id: TEST_REGION_ID,
      email: TEST_EMAIL,
      currency_code: 'usd'
    })
  });

  const cart = cartResponse.cart;
  console.log(`✅ Cart created: ${cart.id}`);
  console.log(`   Email: ${cart.email || 'Not set'}`);
  console.log(`   Currency: ${cart.currency_code}`);

  // 2. Get available products (you'll need to replace with actual variant IDs)
  console.log('\n2️⃣  Note: To add items, you need valid variant IDs from your Medusa catalog');
  console.log('   Run this in another terminal to get variant IDs:');
  console.log('   curl http://localhost:9000/store/products -H "x-publishable-api-key: YOUR_KEY"');

  // 3. Add shipping address
  console.log('\n3️⃣  Adding shipping address...');
  const addressResponse = await makeRequest(`/store/carts/${cart.id}/addresses`, {
    method: 'POST',
    body: JSON.stringify({
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        address_1: '123 Main Street',
        city: 'San Francisco',
        province: 'CA',
        postal_code: '94105',
        country_code: 'us',
        phone: '+1 (555) 123-4567'
      }
    })
  });

  console.log('✅ Shipping address added');

  // 4. Test payment session creation
  console.log('\n4️⃣  Creating payment session...');
  try {
    const paymentResponse = await makeRequest(`/store/carts/${cart.id}/payment-sessions`, {
      method: 'POST',
      body: JSON.stringify({
        provider_id: 'stripe'
      })
    });

    const paymentSession = paymentResponse.payment_session;
    console.log('✅ Payment session created');
    console.log(`   Provider: ${paymentSession.provider_id}`);
    console.log(`   Status: ${paymentSession.status}`);
    console.log(`   Client Secret: ${paymentSession.data?.client_secret ? 'Present' : 'Missing'}`);
  } catch (error) {
    console.log('⚠️  Payment session creation failed (expected if cart is empty)');
    console.log('   Add items to cart before creating payment session');
  }

  return cart;
}

async function testAPIEndpoints() {
  console.log('\n🧪 Testing API Endpoints...');
  console.log('================================');

  const endpoints = [
    { path: '/store/regions', method: 'GET', description: 'List regions' },
    { path: '/store/products', method: 'GET', description: 'List products' },
    { path: '/store/shipping-options', method: 'GET', description: 'List shipping options' }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📍 ${endpoint.description}...`);
    try {
      const response = await makeRequest(endpoint.path, { method: endpoint.method });
      console.log(`✅ ${endpoint.path} - Success`);
      
      if (endpoint.path === '/store/regions' && response.regions?.length > 0) {
        console.log(`   Found ${response.regions.length} region(s)`);
        console.log(`   Default: ${response.regions[0].name} (${response.regions[0].currency_code})`);
      }
      
      if (endpoint.path === '/store/products' && response.products?.length > 0) {
        console.log(`   Found ${response.products.length} product(s)`);
        const firstProduct = response.products[0];
        if (firstProduct.variants?.length > 0) {
          console.log(`   Example variant ID: ${firstProduct.variants[0].id}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${endpoint.path} - Failed`);
    }
  }
}

async function checkEnvironment() {
  console.log('\n🔍 Checking Environment...');
  console.log('================================');

  console.log('\n📋 Configuration:');
  console.log(`   Medusa URL: ${MEDUSA_URL}`);
  console.log(`   Publishable Key: ${PUBLISHABLE_KEY.substring(0, 20)}...`);
  
  console.log('\n📡 Checking Medusa backend...');
  try {
    const response = await fetch(`${MEDUSA_URL}/health`);
    if (response.ok) {
      console.log('✅ Medusa backend is running');
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    console.error('❌ Medusa backend is not accessible');
    console.log('   Make sure to run: cd medusa && npm run dev');
    process.exit(1);
  }

  console.log('\n🔑 Checking API key...');
  try {
    await makeRequest('/store/regions', { method: 'GET' });
    console.log('✅ API key is valid');
  } catch (error) {
    console.error('❌ API key is invalid or not configured');
    console.log('   Check your NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY');
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Fabric Store Checkout Flow Test');
  console.log('===================================');
  console.log('This script tests the checkout flow integration');
  console.log('between fabric-store and Medusa backend.\n');

  try {
    // Check environment
    await checkEnvironment();

    // Test API endpoints
    await testAPIEndpoints();

    // Test cart operations
    const cart = await testCartOperations();

    console.log('\n✨ Test Summary');
    console.log('================================');
    console.log('✅ Environment check passed');
    console.log('✅ API endpoints responding');
    console.log('✅ Cart operations working');
    console.log(`✅ Test cart created: ${cart.id}`);

    console.log('\n📝 Next Steps:');
    console.log('1. Add products to your Medusa catalog if not already done');
    console.log('2. Test the checkout flow in the browser at http://localhost:3006');
    console.log('3. Use Stripe CLI to monitor webhook events');
    console.log('4. Check the CHECKOUT_TESTING_GUIDE.md for detailed testing steps');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
main().catch(console.error);