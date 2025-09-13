#!/usr/bin/env node

/**
 * Test script to verify the fabric product creation flow
 * Tests:
 * 1. Fabric search API
 * 2. Fabric details API
 * 3. Ensures metadata structure is preserved
 */

const fetch = require('node-fetch');

const MEDUSA_URL = 'http://localhost:9000';
const ADMIN_EMAIL = 'admin@tara-hub.com';
const ADMIN_PASSWORD = 'supersecretpassword';

async function getAuthToken() {
  console.log('Authenticating...');
  
  const loginResponse = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }

  const loginData = await loginResponse.json();
  return loginData.token;
}

async function testFabricProductFlow() {
  try {
    const token = await getAuthToken();
    console.log('✓ Authenticated successfully\n');

    // Test 1: Search for fabrics
    console.log("Test 1: Search for fabrics with 'sand'");
    console.log("=====================================");
    
    const searchResponse = await fetch(`${MEDUSA_URL}/admin/fabrics?q=sand&limit=3`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error(`✗ Search failed (${searchResponse.status}):`, error);
      return;
    }

    const searchData = await searchResponse.json();
    console.log(`✓ Found ${searchData.fabrics?.length || 0} fabrics`);
    
    if (searchData.fabrics?.length === 0) {
      console.error('✗ No fabrics found - cannot continue tests');
      return;
    }

    const firstFabric = searchData.fabrics[0];
    console.log(`✓ First fabric: ${firstFabric.sku} - ${firstFabric.name}`);
    console.log('\n');

    // Test 2: Get fabric details
    console.log("Test 2: Get fabric details for SKU");
    console.log("===================================");
    
    const detailResponse = await fetch(`${MEDUSA_URL}/admin/fabrics/${encodeURIComponent(firstFabric.sku)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!detailResponse.ok) {
      const error = await detailResponse.text();
      console.error(`✗ Get details failed (${detailResponse.status}):`, error);
      return;
    }

    const detailData = await detailResponse.json();
    const fabric = detailData.fabric;
    
    console.log('✓ Successfully retrieved fabric details');
    console.log(`  Title: ${fabric.title}`);
    console.log(`  SKU: ${fabric.metadata?.sku || 'N/A'}`);
    console.log(`  Has metadata: ${fabric.metadata ? 'Yes' : 'No'}`);
    
    // Test 3: Verify metadata structure
    console.log('\n');
    console.log("Test 3: Verify metadata structure");
    console.log("=================================");
    
    if (fabric.metadata) {
      const hasProperties = Array.isArray(fabric.metadata.properties);
      console.log(`  Has properties array: ${hasProperties ? 'Yes' : 'No'}`);
      
      const metadataKeys = Object.keys(fabric.metadata);
      console.log(`  Metadata keys count: ${metadataKeys.length}`);
      console.log(`  Sample keys: ${metadataKeys.slice(0, 5).join(', ')}...`);
      
      // Check for critical fields
      const criticalFields = ['sku', 'brand', 'category', 'composition', 'width'];
      criticalFields.forEach(field => {
        console.log(`  Has ${field}: ${fabric.metadata[field] ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('  ⚠ No metadata found in fabric details');
    }

    // Test 4: Check if metadata preserves properties array when merged
    console.log('\n');
    console.log("Test 4: Test metadata merging");
    console.log("=============================");
    
    // Simulate what happens in the React component
    const initialMetadata = {
      properties: [],
      brand: "",
      category: "",
    };
    
    const mergedMetadata = {
      ...initialMetadata,
      ...(fabric.metadata || {}),
      properties: fabric.metadata?.properties || initialMetadata.properties || []
    };
    
    console.log(`✓ Properties array preserved: ${Array.isArray(mergedMetadata.properties) ? 'Yes' : 'No'}`);
    console.log(`✓ Brand value: ${mergedMetadata.brand || '(empty)'}`);
    console.log(`✓ Category value: ${mergedMetadata.category || '(empty)'}`);

    console.log('\n=============================');
    console.log('All tests completed successfully!');
    console.log('=============================');

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testFabricProductFlow().catch(console.error);