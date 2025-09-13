#!/usr/bin/env node

const fetch = require('node-fetch');

// Test credentials
const MEDUSA_URL = 'http://localhost:9000';
const ADMIN_EMAIL = 'admin@tara-hub.com';
const ADMIN_PASSWORD = 'supersecretpassword';

async function getAuthToken() {
  console.log('Authenticating...');
  
  // First, login to get session
  const loginResponse = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }

  const loginData = await loginResponse.json();
  
  // Get session token
  const sessionResponse = await fetch(`${MEDUSA_URL}/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`,
    },
  });

  if (!sessionResponse.ok) {
    throw new Error(`Session creation failed: ${sessionResponse.status}`);
  }

  const sessionData = await sessionResponse.json();
  return sessionData.token || loginData.token;
}

async function testFabricsAPI() {
  try {
    const token = await getAuthToken();
    console.log('✓ Authenticated successfully\n');

    // Test 1: Search for 'sand'
    console.log("Test 1: Searching for 'sand'");
    console.log("=============================");
    
    const searchResponse = await fetch(`${MEDUSA_URL}/admin/fabrics?q=sand&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error(`✗ Search failed (${searchResponse.status}):`, error);
    } else {
      const searchData = await searchResponse.json();
      console.log(`✓ Found ${searchData.fabrics?.length || 0} fabrics`);
      if (searchData.fabrics?.length > 0) {
        console.log('Sample results:');
        searchData.fabrics.slice(0, 3).forEach(f => {
          console.log(`  - ${f.sku}: ${f.name} ($${f.price}/yard)`);
        });
      }
    }

    console.log('\n');

    // Test 2: Search for specific SKU pattern
    console.log("Test 2: Searching for SKU pattern 'HF-'");
    console.log("========================================");
    
    const skuSearchResponse = await fetch(`${MEDUSA_URL}/admin/fabrics?q=HF-&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!skuSearchResponse.ok) {
      const error = await skuSearchResponse.text();
      console.error(`✗ SKU search failed (${skuSearchResponse.status}):`, error);
    } else {
      const skuData = await skuSearchResponse.json();
      console.log(`✓ Found ${skuData.fabrics?.length || 0} fabrics with SKU starting with 'HF-'`);
      if (skuData.fabrics?.length > 0) {
        console.log('Sample results:');
        skuData.fabrics.slice(0, 3).forEach(f => {
          console.log(`  - ${f.sku}: ${f.name}`);
        });
      }
    }

    console.log('\n');

    // Test 3: Get all active fabrics
    console.log("Test 3: Get all active fabrics (no search)");
    console.log("==========================================");
    
    const allResponse = await fetch(`${MEDUSA_URL}/admin/fabrics?limit=10`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!allResponse.ok) {
      const error = await allResponse.text();
      console.error(`✗ List all failed (${allResponse.status}):`, error);
    } else {
      const allData = await allResponse.json();
      console.log(`✓ Total active fabrics: ${allData.pagination?.total || 0}`);
      console.log(`✓ Retrieved ${allData.fabrics?.length || 0} fabrics in this page`);
    }

    console.log('\n');

    // Test 4: Get specific fabric by SKU
    console.log("Test 4: Get specific fabric by SKU");
    console.log("===================================");
    
    // Get a SKU from a fresh search
    const skuTestResponse = await fetch(`${MEDUSA_URL}/admin/fabrics?q=sand&limit=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    if (skuTestResponse.ok) {
      const searchData = await skuTestResponse.json();
      if (searchData.fabrics?.length > 0) {
        const testSku = searchData.fabrics[0].sku;
        console.log(`Testing with SKU: ${testSku}`);
        
        const detailResponse = await fetch(`${MEDUSA_URL}/admin/fabrics/${encodeURIComponent(testSku)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (!detailResponse.ok) {
          const error = await detailResponse.text();
          console.error(`✗ Get fabric details failed (${detailResponse.status}):`, error);
        } else {
          const detailData = await detailResponse.json();
          if (detailData.fabric) {
            console.log('✓ Successfully retrieved fabric details:');
            console.log(`  Title: ${detailData.fabric.title}`);
            console.log(`  Description: ${detailData.fabric.description?.substring(0, 50)}...`);
            console.log(`  Price: $${detailData.fabric.prices?.yard?.amount}/yard`);
            console.log(`  Swatch Price: $${detailData.fabric.prices?.swatch?.amount}`);
            console.log(`  Status: ${detailData.fabric.status}`);
            console.log(`  Has images: ${detailData.fabric.images?.length > 0 ? 'Yes' : 'No'}`);
          }
        }
      }
    }

    console.log('\n=============================');
    console.log('All API tests completed!');
    console.log('=============================');

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testFabricsAPI().catch(console.error);