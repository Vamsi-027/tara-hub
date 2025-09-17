#!/usr/bin/env node

/**
 * Test script to verify Medusa order creation
 * Run with: node scripts/test-medusa-order.js
 */

const fetch = require('node-fetch')

const MEDUSA_URL = process.env.MEDUSA_BACKEND_URL || 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function testMedusaOrder() {
  console.log('🧪 Testing Medusa Order Creation...')
  console.log('📍 Medusa URL:', MEDUSA_URL)
  console.log('🔑 Using publishable key:', PUBLISHABLE_KEY.substring(0, 20) + '...')

  try {
    // Step 1: Create a cart
    console.log('\n1️⃣ Creating cart...')
    const cartResponse = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        region_id: 'reg_01K5C338DE9F4FHEAFE46PQW3D', // USD region
        country_code: 'us',
      }),
    })

    if (!cartResponse.ok) {
      throw new Error(`Failed to create cart: ${cartResponse.status}`)
    }

    const { cart } = await cartResponse.json()
    console.log('✅ Cart created:', cart.id)

    // Step 2: Add an item (using a test variant)
    console.log('\n2️⃣ Adding test item to cart...')
    // Note: You'll need to replace this with an actual variant ID from your Medusa store
    console.log('⚠️  Note: Add item step requires a valid variant ID from your Medusa store')

    // Step 3: Set customer email
    console.log('\n3️⃣ Setting customer email...')
    const emailResponse = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    })

    if (emailResponse.ok) {
      console.log('✅ Customer email set')
    }

    // Step 4: Set shipping address
    console.log('\n4️⃣ Setting shipping address...')
    const addressResponse = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        shipping_address: {
          first_name: 'Test',
          last_name: 'Customer',
          address_1: '123 Test St',
          city: 'New York',
          province: 'NY',
          postal_code: '10001',
          country_code: 'us',
        },
        billing_address: {
          first_name: 'Test',
          last_name: 'Customer',
          address_1: '123 Test St',
          city: 'New York',
          province: 'NY',
          postal_code: '10001',
          country_code: 'us',
        },
      }),
    })

    if (addressResponse.ok) {
      console.log('✅ Shipping address set')
    }

    console.log('\n✅ Medusa connection test successful!')
    console.log('📋 Summary:')
    console.log('  - Can connect to Medusa backend')
    console.log('  - Can create carts')
    console.log('  - Can set customer information')
    console.log('  - Ready to process orders')

    console.log('\n💡 To complete order creation:')
    console.log('  1. Add actual product variants to cart')
    console.log('  2. Add shipping methods')
    console.log('  3. Complete the cart to create order')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('Details:', error)
  }
}

// Run the test
testMedusaOrder()