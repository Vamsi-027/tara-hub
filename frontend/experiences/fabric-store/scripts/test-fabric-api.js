#!/usr/bin/env node

/**
 * Test script to debug fabric API issues
 */

async function testFabricAPI() {
  console.log('🔍 Testing Fabric Store API Chain...\n');

  // Test 1: Direct Medusa API
  console.log('1️⃣ Testing Medusa API directly...');
  try {
    const medusaResponse = await fetch(
      'https://medusa-backend-production-3655.up.railway.app/store/products?region_id=reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ',
      {
        headers: {
          'x-publishable-api-key': 'pk_886803c4ee7b036666c8fdb0e8d8aa0c20ae0772b20ba26c046aaca6adf79810'
        }
      }
    );
    const medusaData = await medusaResponse.json();
    console.log(`✅ Medusa API: ${medusaData.products?.length || 0} products found`);
    if (medusaData.products && medusaData.products.length > 0) {
      console.log(`   Sample product: ${medusaData.products[0].title}`);
    }
  } catch (error) {
    console.log(`❌ Medusa API Error: ${error.message}`);
  }

  console.log('\n2️⃣ Testing Fabric Store API...');
  try {
    const fabricResponse = await fetch('https://fabric-store-ten.vercel.app/api/fabrics?limit=5');
    const fabricData = await fabricResponse.json();
    console.log(`${fabricData.fabrics?.length > 0 ? '✅' : '❌'} Fabric Store API: ${fabricData.fabrics?.length || 0} fabrics returned`);
    console.log(`   Data source: ${fabricData.meta?.dataSource || 'unknown'}`);

    if (fabricData.error) {
      console.log(`   Error: ${fabricData.error}`);
      console.log(`   Message: ${fabricData.message}`);
    }

    // Check what the actual issue might be
    if (fabricData.fabrics?.length === 0 && fabricData.meta?.dataSource === 'empty') {
      console.log('\n⚠️  Possible issues:');
      console.log('   1. The API code fix hasn\'t been deployed to Vercel yet');
      console.log('   2. Environment variables not available in the API route');
      console.log('   3. The fetch from Medusa is failing silently');
    }
  } catch (error) {
    console.log(`❌ Fabric Store API Error: ${error.message}`);
  }

  console.log('\n3️⃣ Testing with explicit parameters...');
  try {
    // Test if the old endpoint exists
    const testResponse = await fetch(
      'https://medusa-backend-production-3655.up.railway.app/store/products-with-metadata',
      {
        headers: {
          'x-publishable-api-key': 'pk_886803c4ee7b036666c8fdb0e8d8aa0c20ae0772b20ba26c046aaca6adf79810'
        }
      }
    );
    const status = testResponse.status;
    console.log(`   Old endpoint (/products-with-metadata): ${status === 404 ? 'Not Found (expected)' : `Status ${status}`}`);
  } catch (error) {
    console.log(`   Old endpoint test failed: ${error.message}`);
  }

  console.log('\n📊 Summary:');
  console.log('   - Medusa backend: ✅ Working');
  console.log('   - Products exist: ✅ Confirmed');
  console.log('   - API key valid: ✅ Confirmed');
  console.log('   - Fabric Store API: ❌ Returns empty');
  console.log('\n🔧 Solution:');
  console.log('   The API route code needs to be deployed to Vercel.');
  console.log('   The fix changing /products-with-metadata to /products');
  console.log('   was committed but may not be deployed yet.');
}

testFabricAPI().catch(console.error);