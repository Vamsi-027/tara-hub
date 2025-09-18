/**
 * Script to test order persistence to Neon database
 * Run with: npm run test:order-persistence
 */

import { execSync } from 'child_process'

async function testOrderPersistence() {
  console.log("🔍 Testing order persistence to Neon database...")

  try {
    // Test 1: Check existing orders via API
    console.log("\n📊 Test 1: Checking existing orders via API...")

    const testEmail = "test@example.com"
    const apiUrl = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
    const publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY || 'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'

    // Query orders by email
    const ordersResponse = await fetch(`${apiUrl}/store/orders-by-email?email=${testEmail}`, {
      headers: {
        'x-publishable-api-key': publishableKey
      }
    })

    if (ordersResponse.ok) {
      const { orders, total } = await ordersResponse.json()
      console.log(`✅ Found ${orders?.length || 0} orders for ${testEmail}`)
      console.log(`   Total orders: ${total || 0}`)

      if (orders && orders.length > 0) {
        console.log("   Recent orders:")
        orders.slice(0, 3).forEach((order: any) => {
          console.log(`   - ${order.id} | ${order.display_id} | ${order.created_at}`)
        })
      }
    } else {
      console.log("⚠️ Could not query orders via API:", ordersResponse.status)
    }

    // Test 2: Create a test order via cart workflow
    console.log("\n📊 Test 2: Creating a test order via cart workflow...")

    const testOrderEmail = `test_${Date.now()}@example.com`

    // Step 1: Create cart
    const cartResponse = await fetch(`${apiUrl}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey
      },
      body: JSON.stringify({
        email: testOrderEmail,
        region_id: "reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ",
        currency_code: "usd"
      })
    })

    if (cartResponse.ok) {
      const { cart } = await cartResponse.json()
      console.log(`✅ Cart created: ${cart.id}`)

      // Step 2: Add test item
      const addItemResponse = await fetch(`${apiUrl}/store/carts/${cart.id}/line-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey
        },
        body: JSON.stringify({
          variant_id: "variant_01K5C2CNNTW2R5B6BHDJ8AQE4A",
          quantity: 1
        })
      })

      if (addItemResponse.ok) {
        console.log("✅ Item added to cart")

        // Step 3: Set addresses
        const addressResponse = await fetch(`${apiUrl}/store/carts/${cart.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': publishableKey
          },
          body: JSON.stringify({
            email: testOrderEmail,
            shipping_address: {
              first_name: "Test",
              last_name: "User",
              address_1: "123 Test St",
              city: "Test City",
              province: "CA",
              postal_code: "12345",
              country_code: "us",
              phone: "555-1234"
            }
          })
        })

        if (addressResponse.ok) {
          console.log("✅ Addresses set")

          // Step 4: Complete cart
          console.log("🔄 Attempting to complete cart...")
          const completeResponse = await fetch(`${apiUrl}/store/carts/${cart.id}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': publishableKey
            }
          })

          if (completeResponse.ok) {
            const result = await completeResponse.json()
            if (result.order) {
              console.log("✅ Order created successfully!")
              console.log(`   Order ID: ${result.order.id}`)
              console.log(`   Display ID: ${result.order.display_id}`)
              console.log(`   Email: ${result.order.email}`)

              // Verify it's in the database
              await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

              const verifyResponse = await fetch(`${apiUrl}/store/orders-by-email?email=${testOrderEmail}`, {
                headers: {
                  'x-publishable-api-key': publishableKey
                }
              })

              if (verifyResponse.ok) {
                const { orders } = await verifyResponse.json()
                if (orders && orders.length > 0) {
                  console.log("✅ Order verified in database!")
                } else {
                  console.log("⚠️ Order not found in database after creation")
                }
              }
            } else {
              console.log("⚠️ Cart completed but no order returned")
            }
          } else {
            const errorText = await completeResponse.text()
            console.log("❌ Cart completion failed:", completeResponse.status)
            console.log("   Error:", errorText)

            // Test 3: Try direct insertion endpoint
            console.log("\n📊 Test 3: Testing direct insertion endpoint...")

            const directResponse = await fetch(`${apiUrl}/store/orders/direct-create`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': publishableKey
              },
              body: JSON.stringify({
                email: testOrderEmail,
                items: [{
                  title: "Test Fabric",
                  quantity: 1,
                  price: 100
                }],
                shipping_address: {
                  first_name: "Test",
                  last_name: "User",
                  address_1: "123 Test St",
                  city: "Test City",
                  province: "CA",
                  postal_code: "12345",
                  country_code: "us"
                },
                total: 100,
                subtotal: 90,
                shipping_total: 10
              })
            })

            if (directResponse.ok) {
              const { order } = await directResponse.json()
              console.log("✅ Order created via direct insertion!")
              console.log(`   Order ID: ${order.id}`)
              console.log(`   Display ID: ${order.display_id}`)
            } else {
              const directError = await directResponse.text()
              console.log("❌ Direct insertion also failed:", directError)
            }
          }
        } else {
          console.log("❌ Failed to set addresses")
        }
      } else {
        console.log("❌ Failed to add item to cart")
      }
    } else {
      console.log("❌ Failed to create cart")
    }

    console.log("\n✨ Order persistence testing complete!")

  } catch (error) {
    console.error("❌ Test failed:", error)
  }

  process.exit(0)
}

// Run the test
testOrderPersistence()