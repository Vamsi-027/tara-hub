/**
 * Test script for Contact Management System
 * Tests the entire integration flow from submission to admin retrieval
 */

async function testContactIntegration() {
  console.log("🧪 Testing Contact Management System Integration...")

  const BASE_URL = "http://localhost:9000"
  const FABRIC_STORE_URL = "http://localhost:3006"

  try {
    // Test 1: Submit a contact form via store API
    console.log("\n1. Testing contact form submission via store API...")
    
    const testSubmission = {
      name: "Test Customer",
      email: "test@example.com",
      phone: "+1 (555) 123-4567",
      subject: "Fabric Inquiry - Navy Blue Canvas",
      message: "I'm interested in learning more about your navy blue canvas fabric. Do you have samples available?",
      order_number: "ORD-12345"
    }

    const submitResponse = await fetch(`${BASE_URL}/store/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testSubmission)
    })

    if (submitResponse.ok) {
      const submitData = await submitResponse.json()
      console.log("✅ Contact submission successful:", submitData.message)
      console.log("📝 Contact ID:", submitData.contact_id)
    } else {
      const error = await submitResponse.json()
      console.log("❌ Contact submission failed:", error)
      return
    }

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test 2: Retrieve contacts via admin API
    console.log("\n2. Testing contact retrieval via admin API...")
    
    const listResponse = await fetch(`${BASE_URL}/admin/contacts?limit=5`, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (listResponse.ok) {
      const listData = await listResponse.json()
      console.log("✅ Contact retrieval successful")
      console.log(`📊 Found ${listData.count} total contacts`)
      console.log(`📋 Retrieved ${listData.contacts.length} contacts`)
      
      if (listData.contacts.length > 0) {
        const latestContact = listData.contacts[0]
        console.log("📄 Latest contact:", {
          id: latestContact.id,
          name: latestContact.name,
          email: latestContact.email,
          subject: latestContact.subject,
          status: latestContact.status,
          priority: latestContact.priority,
          category: latestContact.category
        })
      }
    } else {
      const error = await listResponse.json()
      console.log("❌ Contact retrieval failed:", error)
    }

    // Test 3: Get contact statistics
    console.log("\n3. Testing contact statistics...")
    
    const statsResponse = await fetch(`${BASE_URL}/admin/contacts/stats`)
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json()
      console.log("✅ Contact statistics retrieved:")
      console.log("📈 Statistics:", {
        total: stats.total,
        new: stats.new,
        in_progress: stats.in_progress,
        resolved: stats.resolved,
        urgent: stats.urgent,
        today: stats.today,
        this_week: stats.this_week,
        response_rate: `${Math.round(stats.response_rate)}%`
      })
    } else {
      console.log("❌ Statistics retrieval failed")
    }

    // Test 4: Test fabric store integration
    console.log("\n4. Testing fabric store frontend integration...")
    
    try {
      const fabricStoreResponse = await fetch(`${FABRIC_STORE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Fabric Store Customer",
          email: "fabric.customer@example.com",
          subject: "Velvet Fabric Samples",
          message: "I need velvet fabric samples for my interior design project. Please send me your catalog."
        })
      })

      if (fabricStoreResponse.ok) {
        const fabricData = await fabricStoreResponse.json()
        console.log("✅ Fabric store integration working:", fabricData.message)
      } else {
        console.log("⚠️ Fabric store integration test failed (expected if fabric store is not running)")
      }
    } catch (fabricStoreError) {
      console.log("⚠️ Fabric store not accessible (expected if not running):", fabricStoreError.message)
    }

    console.log("\n🎉 Contact Management System Integration Test Complete!")
    console.log("\n📋 Next Steps:")
    console.log("1. Visit http://localhost:9000/app/contacts to see admin dashboard")
    console.log("2. Test the contact form at http://localhost:3006/contact")
    console.log("3. Configure RESEND_API_KEY for email notifications")
    console.log("4. Set up ADMIN_EMAIL for admin notifications")

  } catch (error) {
    console.error("❌ Integration test failed:", error)
  }
}

// Run if called directly
if (require.main === module) {
  testContactIntegration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { testContactIntegration }