#!/usr/bin/env node

const MEDUSA_URL = 'http://localhost:9000'
const PUBLISHABLE_KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function createTestOrder() {
  try {
    console.log('🛒 Starting Medusa order test...\n')

    // Step 1: Get regions
    console.log('1️⃣ Fetching regions...')
    const regionsRes = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    })
    const { regions } = await regionsRes.json()
    const region = regions[0]
    console.log(`✅ Using region: ${region.name} (${region.id})\n`)

    // Step 2: Create cart
    console.log('2️⃣ Creating cart...')
    const cartRes = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        email: 'test@example.com',
        region_id: region.id
      })
    })
    const { cart } = await cartRes.json()
    console.log(`✅ Cart created: ${cart.id}\n`)

    // Step 3: Add product (using the correct variant ID)
    console.log('3️⃣ Adding product to cart...')
    const variantId = 'variant_01K5C2CNNTW2R5B6BHDJ8AQE4A' // Sandwell Lipstick - Fabric Per Yard
    const addItemRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/line-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        variant_id: variantId,
        quantity: 2
      })
    })

    if (!addItemRes.ok) {
      const error = await addItemRes.text()
      throw new Error(`Failed to add item: ${error}`)
    }

    console.log(`✅ Added variant ${variantId} to cart\n`)

    // Step 4: Add shipping address
    console.log('4️⃣ Adding shipping address...')
    const addressRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address_1: '123 Test St',
          city: 'New York',
          province: 'NY',
          postal_code: '10001',
          country_code: 'us',
          phone: '555-0123'
        },
        billing_address: {
          first_name: 'Test',
          last_name: 'User',
          address_1: '123 Test St',
          city: 'New York',
          province: 'NY',
          postal_code: '10001',
          country_code: 'us',
          phone: '555-0123'
        },
        email: 'test@example.com'
      })
    })

    if (!addressRes.ok) {
      const error = await addressRes.text()
      throw new Error(`Failed to add address: ${error}`)
    }

    console.log('✅ Address added\n')

    // Step 5: Complete cart to create order
    console.log('5️⃣ Completing cart to create order...')
    const completeRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    })

    if (!completeRes.ok) {
      const error = await completeRes.text()
      throw new Error(`Failed to complete cart: ${error}`)
    }

    const { order } = await completeRes.json()

    console.log('🎉 SUCCESS! Order created in Medusa!\n')
    console.log('📦 Order Details:')
    console.log(`   ID: ${order.id}`)
    console.log(`   Email: ${order.email}`)
    console.log(`   Status: ${order.status}`)
    console.log(`   Total: ${order.currency_code.toUpperCase()} ${(order.total / 100).toFixed(2)}`)
    console.log(`   Items: ${order.items.length}`)
    console.log('\n✅ Order successfully stored in Medusa database!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createTestOrder()
