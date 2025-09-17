#!/usr/bin/env node

/**
 * Medusa Product Pricing Setup Script
 *
 * This script adds pricing to Medusa product variants for the fabric store.
 * It requires admin authentication to access the Medusa Admin API.
 */

const https = require('https');

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app';
const ADMIN_EMAIL = 'admin@tara-hub.com';
const ADMIN_PASSWORD = 'supersecretpassword';

// Product variants that need pricing
const VARIANTS_TO_PRICE = [
  {
    id: 'variant_01K51VADRT5G8KNKP7HWFEY235',
    name: 'Sandwell Lipstick - Fabric Per Yard',
    prices: [
      {
        region_id: 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN', // Europe
        currency_code: 'eur',
        amount: 2500 // €25.00
      }
    ]
  },
  {
    id: 'variant_01K51VADRSDBEJTCXV0GTPZ484',
    name: 'Sandwell Lipstick - Swatch Sample',
    prices: [
      {
        region_id: 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN', // Europe
        currency_code: 'eur',
        amount: 500 // €5.00
      }
    ]
  },
  {
    id: 'variant_01K57QA138A2MKQQNR667AM9XC',
    name: 'Jefferson Linen Sunglow - Fabric Per Yard',
    prices: [
      {
        region_id: 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN', // Europe
        currency_code: 'eur',
        amount: 3000 // €30.00
      }
    ]
  },
  {
    id: 'variant_01K57QA137DXZZN3FZS20X7EAQ',
    name: 'Jefferson Linen Sunglow - Swatch Sample',
    prices: [
      {
        region_id: 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN', // Europe
        currency_code: 'eur',
        amount: 500 // €5.00
      }
    ]
  }
];

/**
 * Make HTTP request
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Authenticate with Medusa Admin
 */
async function authenticateAdmin() {
  console.log('🔐 Authenticating with Medusa Admin...');

  const options = {
    hostname: 'medusa-backend-production-3655.up.railway.app',
    port: 443,
    path: '/admin/auth',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const authData = {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  };

  try {
    const response = await makeRequest(options, authData);

    if (response.status === 200 && response.data.user) {
      const sessionCookie = response.headers['set-cookie']?.find(cookie =>
        cookie.startsWith('connect.sid=')
      );

      if (sessionCookie) {
        console.log('✅ Admin authentication successful');
        return sessionCookie.split(';')[0];
      }
    }

    console.error('❌ Authentication failed:', response);
    throw new Error('Authentication failed');
  } catch (error) {
    console.error('❌ Authentication error:', error);
    throw error;
  }
}

/**
 * Add pricing to a variant
 */
async function addVariantPricing(sessionCookie, variant) {
  console.log(`💰 Adding pricing to ${variant.name}...`);

  const options = {
    hostname: 'medusa-backend-production-3655.up.railway.app',
    port: 443,
    path: `/admin/products/variants/${variant.id}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    }
  };

  const updateData = {
    prices: variant.prices
  };

  try {
    const response = await makeRequest(options, updateData);

    if (response.status === 200) {
      console.log(`✅ Successfully added pricing to ${variant.name}`);
      console.log(`   Prices: ${variant.prices.map(p => `${p.currency_code.toUpperCase()} ${(p.amount/100).toFixed(2)}`).join(', ')}`);
      return true;
    } else {
      console.error(`❌ Failed to add pricing to ${variant.name}:`, response);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error adding pricing to ${variant.name}:`, error);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Medusa Product Pricing Setup');
  console.log('========================================\n');

  try {
    // Authenticate
    const sessionCookie = await authenticateAdmin();

    // Add pricing to each variant
    let successCount = 0;
    let totalCount = VARIANTS_TO_PRICE.length;

    for (const variant of VARIANTS_TO_PRICE) {
      const success = await addVariantPricing(sessionCookie, variant);
      if (success) successCount++;

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n========================================');
    console.log(`✅ Pricing setup complete: ${successCount}/${totalCount} variants updated`);

    if (successCount === totalCount) {
      console.log('🎉 All product variants now have pricing configured!');
      console.log('💡 The fabric-store integration should now work completely.');
    } else {
      console.log('⚠️  Some variants failed to update. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Medusa Product Pricing Setup Script

Usage: node setup-medusa-pricing.js

This script adds pricing to Medusa product variants for the fabric store.
Update the ADMIN_EMAIL and ADMIN_PASSWORD constants before running.

Options:
  --help, -h    Show this help message

The script will:
1. Authenticate with Medusa Admin API
2. Add pricing to all fabric product variants
3. Enable the fabric-store to complete order creation
`);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { main, VARIANTS_TO_PRICE };