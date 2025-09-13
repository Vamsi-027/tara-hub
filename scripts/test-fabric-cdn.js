#!/usr/bin/env node

const fetch = require('node-fetch');

const MEDUSA_URL = 'http://localhost:9000';
const ADMIN_EMAIL = 'admin@tara-hub.com';
const ADMIN_PASSWORD = 'supersecretpassword';

async function getAuthToken() {
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

async function testCDNUrls() {
  try {
    const token = await getAuthToken();
    console.log('✓ Authenticated\n');

    // Test fabric with known images
    const skus = ['HF-G8Q43HR7T', 'HF-JK6F2K96Z', 'HF-R7K64Q5RR'];
    
    for (const sku of skus) {
      console.log(`Testing SKU: ${sku}`);
      console.log('=' .repeat(50));
      
      // Get details
      const response = await fetch(`${MEDUSA_URL}/admin/fabrics/${encodeURIComponent(sku)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${sku}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const fabric = data.fabric;
      
      console.log(`Title: ${fabric.title}`);
      console.log(`Thumbnail: ${fabric.thumbnail || 'None'}`);
      
      if (fabric.thumbnail) {
        const hasCDN = fabric.thumbnail.includes('cdn.deepcrm.ai');
        console.log(`Has CDN prefix: ${hasCDN ? '✓ Yes' : '✗ No'}`);
      }
      
      if (fabric.images?.length > 0) {
        console.log(`Images (${fabric.images.length} total):`);
        fabric.images.slice(0, 2).forEach((img, i) => {
          const url = img.url || img;
          console.log(`  ${i + 1}. ${url.substring(0, 80)}...`);
          console.log(`     Has CDN: ${url.includes('cdn.deepcrm.ai') ? '✓ Yes' : '✗ No'}`);
        });
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

testCDNUrls().catch(console.error);