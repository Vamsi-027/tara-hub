/**
 * Comprehensive Orders Retrieval Debug Script
 * Tests all possible ways to fetch orders from Medusa v2
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = 'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'
const TEST_EMAIL = 'vamsicheruku027@gmail.com'

async function debugOrdersRetrieval() {
  console.log('🔍 Debugging Orders Retrieval for:', TEST_EMAIL)
  console.log('🌐 Medusa Backend:', MEDUSA_BACKEND_URL)
  console.log('')

  const testMethods = [
    {
      name: 'Store API - Orders with email filter',
      endpoint: `/store/orders?email=${encodeURIComponent(TEST_EMAIL)}`,
      method: 'GET',
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    },
    {
      name: 'Store API - All orders (no filter)',
      endpoint: `/store/orders`,
      method: 'GET',
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    },
    {
      name: 'Store API - Orders with query params',
      endpoint: `/store/orders?q=${encodeURIComponent(TEST_EMAIL)}`,
      method: 'GET',
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    },
    {
      name: 'Admin API - Orders with email filter',
      endpoint: `/admin/orders?email=${encodeURIComponent(TEST_EMAIL)}`,
      method: 'GET',
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    },
    {
      name: 'Admin API - All orders',
      endpoint: `/admin/orders`,
      method: 'GET',
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    },
    {
      name: 'Store API - Customer orders (requires auth)',
      endpoint: `/store/customers/me/orders`,
      method: 'GET',
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
        'Authorization': `Bearer ${TEST_EMAIL}`
      }
    },
    {
      name: 'Store API - Orders search',
      endpoint: `/store/orders/search?email=${encodeURIComponent(TEST_EMAIL)}`,
      method: 'GET',
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    }
  ]

  for (const testMethod of testMethods) {
    console.log(`\n📋 Testing: ${testMethod.name}`)
    console.log(`   Endpoint: ${testMethod.endpoint}`)

    try {
      const response = await fetch(`${MEDUSA_BACKEND_URL}${testMethod.endpoint}`, {
        method: testMethod.method,
        headers: {
          'Content-Type': 'application/json',
          ...testMethod.headers
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Status: ${response.status} OK`)

        // Check for orders in different response structures
        const orders = data.orders || data.data || (Array.isArray(data) ? data : [])
        console.log(`   📦 Orders found: ${orders.length}`)

        if (orders.length > 0) {
          console.log(`   🎯 FOUND ORDERS! First order:`)
          const firstOrder = orders[0]
          console.log(`      - ID: ${firstOrder.id || 'N/A'}`)
          console.log(`      - Display ID: ${firstOrder.display_id || 'N/A'}`)
          console.log(`      - Email: ${firstOrder.email || 'N/A'}`)
          console.log(`      - Status: ${firstOrder.status || 'N/A'}`)
          console.log(`      - Total: ${firstOrder.total || 'N/A'}`)
          console.log(`      - Created: ${firstOrder.created_at || 'N/A'}`)

          // Check if the email matches what we're looking for
          if (firstOrder.email === TEST_EMAIL) {
            console.log(`   🎉 EXACT EMAIL MATCH FOUND!`)
          } else {
            console.log(`   ⚠️ Email doesn't match. Expected: ${TEST_EMAIL}, Got: ${firstOrder.email}`)
          }

          // Log full response structure for the working method
          console.log(`   📄 Response structure:`, Object.keys(data))
          if (data.count !== undefined) console.log(`   📊 Total count: ${data.count}`)
          if (data.limit !== undefined) console.log(`   📄 Limit: ${data.limit}`)
          if (data.offset !== undefined) console.log(`   📄 Offset: ${data.offset}`)

          // This method worked - return early
          console.log(`\n🎯 SUCCESS: Found working method - ${testMethod.name}`)
          return {
            working_method: testMethod,
            orders_found: orders.length,
            sample_order: firstOrder,
            full_response_keys: Object.keys(data)
          }
        }
      } else {
        console.log(`   ❌ Status: ${response.status} ${response.statusText}`)

        if (response.status === 401) {
          console.log(`   🔐 Authentication required`)
        } else if (response.status === 404) {
          console.log(`   🚫 Endpoint not found`)
        } else if (response.status === 403) {
          console.log(`   🚫 Access forbidden`)
        } else {
          const errorText = await response.text()
          if (errorText && !errorText.includes('<!DOCTYPE html>')) {
            console.log(`   💬 Error: ${errorText.substring(0, 150)}`)
          }
        }
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`)
    }
  }

  // If no method worked, try some alternative approaches
  console.log(`\n🔍 No orders found with standard methods. Trying alternatives...`)

  // Method: Try to search by different fields
  const alternativeMethods = [
    `/store/orders?filters[email]=${encodeURIComponent(TEST_EMAIL)}`,
    `/admin/orders?fields=id,email,total,created_at&email=${encodeURIComponent(TEST_EMAIL)}`,
    `/admin/orders?expand=items&email=${encodeURIComponent(TEST_EMAIL)}`,
  ]

  for (const endpoint of alternativeMethods) {
    console.log(`\n🔄 Alternative: ${endpoint}`)
    try {
      const response = await fetch(`${MEDUSA_BACKEND_URL}${endpoint}`, {
        headers: {
          'x-publishable-api-key': PUBLISHABLE_KEY
        }
      })

      if (response.ok) {
        const data = await response.json()
        const orders = data.orders || data.data || []
        console.log(`   ✅ Found ${orders.length} orders`)

        if (orders.length > 0) {
          console.log(`   🎯 FOUND WITH ALTERNATIVE METHOD!`)
          return {
            working_method: { endpoint, name: 'Alternative method' },
            orders_found: orders.length,
            sample_order: orders[0]
          }
        }
      } else {
        console.log(`   ❌ ${response.status}`)
      }
    } catch (error) {
      console.log(`   💥 ${error.message}`)
    }
  }

  console.log(`\n❌ No working method found to retrieve orders`)
  console.log(`💡 Suggestions:`)
  console.log(`1. Check if orders require admin authentication`)
  console.log(`2. Verify the order email exactly matches: "${TEST_EMAIL}"`)
  console.log(`3. Check if orders are in a different table/collection`)
  console.log(`4. Verify Medusa configuration allows order querying`)

  return null
}

// Run the debug
debugOrdersRetrieval().then(result => {
  if (result) {
    console.log(`\n🎉 SOLUTION FOUND:`)
    console.log(`Method: ${result.working_method.name}`)
    console.log(`Endpoint: ${result.working_method.endpoint || result.working_method.name}`)
    console.log(`Orders found: ${result.orders_found}`)
  } else {
    console.log(`\n❌ INVESTIGATION NEEDED:`)
    console.log(`All standard Medusa API methods failed to retrieve orders`)
    console.log(`Manual database inspection may be required`)
  }
}).catch(error => {
  console.error('Debug script failed:', error)
})