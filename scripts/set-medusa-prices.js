#!/usr/bin/env node

/**
 * Set Product Prices in Medusa Admin
 * This script sets prices for product variants in Medusa
 */

const https = require('https');

// Configuration
const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app';
const ADMIN_EMAIL = 'admin@tara-hub.com'; // Update with your admin email
const ADMIN_PASSWORD = 'your-admin-password'; // Update with your admin password

// Product variant pricing configuration
const VARIANT_PRICING = [
  {
    variantId: 'variant_01K51VADRT5G8KNKP7HWFEY235',
    name: 'Sandwell Lipstick - Fabric Per Yard',
    prices: [
      {
        region_id: 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN',
        currency_code: 'usd',
        amount: 12500 // $125.00 in cents
      }
    ]
  },
  {
    variantId: 'variant_01K51VADRSDBEJTCXV0GTPZ484',
    name: 'Sandwell Lipstick - Swatch Sample',
    prices: [
      {
        region_id: 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN',
        currency_code: 'usd',
        amount: 500 // $5.00 in cents
      }
    ]
  },
  {
    variantId: 'variant_01K57QA138A2MKQQNR667AM9XC',
    name: 'Jefferson Linen Sunglow - Fabric Per Yard',
    prices: [
      {
        region_id: 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN',
        currency_code: 'usd',
        amount: 8500 // $85.00 in cents
      }
    ]
  },
  {
    variantId: 'variant_01K57QA137DXZZN3FZS20X7EAQ',
    name: 'Jefferson Linen Sunglow - Swatch Sample',
    prices: [
      {
        region_id: 'reg_01K4G3YNKXEQ8G9EK2PJHE71QN',
        currency_code: 'usd',
        amount: 350 // $3.50 in cents
      }
    ]
  }
];

// Helper function for HTTPS requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
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
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function authenticateAdmin() {
  console.log('🔐 Authenticating with Medusa Admin...');
  console.log('   Using email:', ADMIN_EMAIL);

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
        console.log('✅ Authentication successful!');
        return sessionCookie.split(';')[0];
      }
    }

    console.error('❌ Authentication failed. Please check your credentials.');
    console.log('Response:', response.data);
    return null;
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return null;
  }
}

async function setVariantPricing(sessionCookie, variant) {
  console.log(`\n💰 Setting price for: ${variant.name}`);

  const options = {
    hostname: 'medusa-backend-production-3655.up.railway.app',
    port: 443,
    path: `/admin/products/variants/${variant.variantId}`,
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
      console.log(`✅ Price set successfully!`);
      variant.prices.forEach(price => {
        console.log(`   ${price.currency_code.toUpperCase()}: $${(price.amount / 100).toFixed(2)}`);
      });
      return true;
    } else {
      console.error(`❌ Failed to set price:`, response.data);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error setting price:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Medusa Pricing Setup Script');
  console.log('================================\n');

  // Check if credentials are set
  if (ADMIN_PASSWORD === 'your-admin-password') {
    console.log('⚠️  Please update ADMIN_PASSWORD in the script first!');
    console.log('   Edit the script and set your actual admin password.');
    process.exit(1);
  }

  // Authenticate
  const sessionCookie = await authenticateAdmin();
  if (!sessionCookie) {
    console.log('\n❌ Could not authenticate. Please check your credentials.');
    process.exit(1);
  }

  // Set pricing for each variant
  let successCount = 0;
  for (const variant of VARIANT_PRICING) {
    const success = await setVariantPricing(sessionCookie, variant);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between requests
  }

  console.log('\n================================');
  console.log(`✅ Pricing setup complete!`);
  console.log(`   Successfully updated: ${successCount}/${VARIANT_PRICING.length} variants`);

  if (successCount === VARIANT_PRICING.length) {
    console.log('\n🎉 All prices have been set successfully!');
    console.log('💡 Your fabric store will now show the correct prices.');
  } else {
    console.log('\n⚠️  Some variants failed. Check the logs above for details.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}