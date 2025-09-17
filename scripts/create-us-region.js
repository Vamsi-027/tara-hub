#!/usr/bin/env node

/**
 * Create US Region with USD Pricing in Medusa
 *
 * This script uses Medusa Admin API to create a complete US region setup
 * following industry best practices.
 */

const https = require('https');

// Configuration - Update these with your actual credentials
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app';
const ADMIN_EMAIL = 'admin@tara-hub.com';
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || 'your-password-here';

// Helper for HTTPS requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body),
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
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

  const response = await makeRequest({
    hostname: 'medusa-backend-production-3655.up.railway.app',
    port: 443,
    path: '/admin/auth',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (response.status === 200 && response.data.user) {
    const sessionCookie = response.headers['set-cookie']?.find(
      cookie => cookie.startsWith('connect.sid=')
    );
    if (sessionCookie) {
      console.log('✅ Authentication successful!');
      return sessionCookie.split(';')[0];
    }
  }

  console.error('❌ Authentication failed. Please check your credentials.');
  return null;
}

async function checkExistingRegions(sessionCookie) {
  console.log('\n🔍 Checking existing regions...');

  const response = await makeRequest({
    hostname: 'medusa-backend-production-3655.up.railway.app',
    port: 443,
    path: '/admin/regions',
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json'
    }
  });

  if (response.status === 200 && response.data.regions) {
    console.log(`📍 Found ${response.data.regions.length} existing regions:`);
    response.data.regions.forEach(region => {
      console.log(`   - ${region.name} (${region.currency_code.toUpperCase()}) - ID: ${region.id}`);
    });

    // Check if US region already exists
    const usRegion = response.data.regions.find(r =>
      r.currency_code === 'usd' || r.name.toLowerCase().includes('united states')
    );

    return { regions: response.data.regions, usRegion };
  }

  return { regions: [], usRegion: null };
}

async function createUSRegion(sessionCookie) {
  console.log('\n🏗️ Creating US region with best practices...');

  const regionData = {
    name: 'United States',
    currency_code: 'usd',
    tax_rate: 6.35, // Average US sales tax
    tax_code: 'US',
    countries: ['us'],
    payment_providers: ['manual'],
    fulfillment_providers: ['manual'],
    metadata: {
      tax_calculation: 'dynamic',
      timezone: 'America/New_York',
      locale: 'en-US',
      date_format: 'MM/DD/YYYY',
      weight_unit: 'lb',
      dimension_unit: 'in'
    }
  };

  const response = await makeRequest({
    hostname: 'medusa-backend-production-3655.up.railway.app',
    port: 443,
    path: '/admin/regions',
    method: 'POST',
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json'
    }
  }, regionData);

  if (response.status === 200 && response.data.region) {
    console.log('✅ US region created successfully!');
    console.log(`   ID: ${response.data.region.id}`);
    console.log(`   Name: ${response.data.region.name}`);
    console.log(`   Currency: ${response.data.region.currency_code.toUpperCase()}`);
    return response.data.region;
  } else {
    console.error('❌ Failed to create region:', response.data);
    return null;
  }
}

async function updateRegionSettings(sessionCookie, regionId) {
  console.log('\n⚙️ Updating region settings...');

  const updateData = {
    includes_tax: false, // US prices typically exclude tax
    automatic_taxes: true,
    gift_cards_taxable: false
  };

  const response = await makeRequest({
    hostname: 'medusa-backend-production-3655.up.railway.app',
    port: 443,
    path: `/admin/regions/${regionId}`,
    method: 'POST',
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json'
    }
  }, updateData);

  if (response.status === 200) {
    console.log('✅ Region settings updated');
    return true;
  } else {
    console.warn('⚠️ Could not update region settings:', response.data.message);
    return false;
  }
}

async function createShippingOptions(sessionCookie, regionId) {
  console.log('\n🚚 Creating shipping options...');

  // First, get the shipping profile
  const profileResponse = await makeRequest({
    hostname: 'medusa-backend-production-3655.up.railway.app',
    port: 443,
    path: '/admin/shipping-profiles',
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json'
    }
  });

  if (!profileResponse.data.shipping_profiles || profileResponse.data.shipping_profiles.length === 0) {
    console.warn('⚠️ No shipping profiles found');
    return;
  }

  const profileId = profileResponse.data.shipping_profiles[0].id;

  const shippingOptions = [
    {
      name: 'Standard Shipping (5-7 days)',
      region_id: regionId,
      profile_id: profileId,
      provider_id: 'manual',
      data: { id: 'standard' },
      price_type: 'flat_rate',
      amount: 1000, // $10.00
      is_return: false,
      admin_only: false
    },
    {
      name: 'Express Shipping (2-3 days)',
      region_id: regionId,
      profile_id: profileId,
      provider_id: 'manual',
      data: { id: 'express' },
      price_type: 'flat_rate',
      amount: 2500, // $25.00
      is_return: false,
      admin_only: false
    },
    {
      name: 'Free Shipping (Orders over $500)',
      region_id: regionId,
      profile_id: profileId,
      provider_id: 'manual',
      data: { id: 'free' },
      price_type: 'flat_rate',
      amount: 0,
      is_return: false,
      admin_only: false,
      requirements: [
        {
          type: 'min_subtotal',
          amount: 50000 // $500.00
        }
      ]
    }
  ];

  for (const option of shippingOptions) {
    try {
      const response = await makeRequest({
        hostname: 'medusa-backend-production-3655.up.railway.app',
        port: 443,
        path: '/admin/shipping-options',
        method: 'POST',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json'
        }
      }, option);

      if (response.status === 200) {
        console.log(`✅ Created: ${option.name}`);
      } else {
        console.warn(`⚠️ Could not create ${option.name}:`, response.data.message);
      }
    } catch (error) {
      console.warn(`⚠️ Error creating ${option.name}:`, error.message);
    }
  }
}

async function updateProductPricing(sessionCookie, regionId) {
  console.log('\n💰 Updating product pricing for USD...');

  const variantPricing = [
    {
      variantId: 'variant_01K51VADRT5G8KNKP7HWFEY235',
      name: 'Sandwell Lipstick - Fabric Per Yard',
      usdPrice: 53000 // $530.00
    },
    {
      variantId: 'variant_01K51VADRSDBEJTCXV0GTPZ484',
      name: 'Sandwell Lipstick - Swatch Sample',
      usdPrice: 450 // $4.50
    },
    {
      variantId: 'variant_01K57QA138A2MKQQNR667AM9XC',
      name: 'Jefferson Linen Sunglow - Fabric Per Yard',
      usdPrice: 8500 // $85.00
    },
    {
      variantId: 'variant_01K57QA137DXZZN3FZS20X7EAQ',
      name: 'Jefferson Linen Sunglow - Swatch Sample',
      usdPrice: 350 // $3.50
    }
  ];

  let successCount = 0;

  for (const variant of variantPricing) {
    try {
      const response = await makeRequest({
        hostname: 'medusa-backend-production-3655.up.railway.app',
        port: 443,
        path: `/admin/variants/${variant.variantId}`,
        method: 'POST',
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json'
        }
      }, {
        prices: [
          {
            region_id: regionId,
            currency_code: 'usd',
            amount: variant.usdPrice
          }
        ]
      });

      if (response.status === 200) {
        console.log(`✅ ${variant.name}: $${(variant.usdPrice/100).toFixed(2)}`);
        successCount++;
      } else {
        console.warn(`⚠️ Could not update ${variant.name}:`, response.data.message);
      }
    } catch (error) {
      console.warn(`⚠️ Error updating ${variant.name}:`, error.message);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n📊 Updated ${successCount}/${variantPricing.length} variant prices`);
}

async function updateStoreCurrencies(sessionCookie) {
  console.log('\n🏪 Updating store currencies...');

  // Get store details
  const storeResponse = await makeRequest({
    hostname: 'medusa-backend-production-3655.up.railway.app',
    port: 443,
    path: '/admin/store',
    method: 'GET',
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json'
    }
  });

  if (storeResponse.status !== 200 || !storeResponse.data.store) {
    console.warn('⚠️ Could not retrieve store details');
    return;
  }

  const store = storeResponse.data.store;
  const currencies = store.currencies || [];

  // Check if USD is already added
  if (!currencies.find(c => c.code === 'usd')) {
    currencies.push({ code: 'usd' });
  }

  // Update store with USD currency
  const updateResponse = await makeRequest({
    hostname: 'medusa-backend-production-3655.up.railway.app',
    port: 443,
    path: '/admin/store',
    method: 'POST',
    headers: {
      'Cookie': sessionCookie,
      'Content-Type': 'application/json'
    }
  }, {
    currencies: currencies.map(c => c.code),
    default_currency_code: 'usd'
  });

  if (updateResponse.status === 200) {
    console.log('✅ Store now accepts USD');
    console.log(`   Available currencies: ${currencies.map(c => c.code.toUpperCase()).join(', ')}`);
  } else {
    console.warn('⚠️ Could not update store currencies:', updateResponse.data.message);
  }
}

async function main() {
  console.log('🚀 Medusa US Region Setup Script');
  console.log('==================================\n');

  if (ADMIN_PASSWORD === 'your-password-here') {
    console.log('⚠️  Please set your admin password:');
    console.log('   Set MEDUSA_ADMIN_PASSWORD environment variable');
    console.log('   Or update ADMIN_PASSWORD in the script');
    process.exit(1);
  }

  try {
    // Step 1: Authenticate
    const sessionCookie = await authenticateAdmin();
    if (!sessionCookie) {
      console.log('\n❌ Authentication failed. Exiting.');
      process.exit(1);
    }

    // Step 2: Check existing regions
    const { regions, usRegion } = await checkExistingRegions(sessionCookie);

    let regionId;

    if (usRegion) {
      console.log(`\n✅ US region already exists: ${usRegion.id}`);
      regionId = usRegion.id;

      // Update existing region settings
      await updateRegionSettings(sessionCookie, regionId);
    } else {
      // Step 3: Create US region
      const newRegion = await createUSRegion(sessionCookie);
      if (!newRegion) {
        console.log('\n❌ Failed to create US region. Exiting.');
        process.exit(1);
      }
      regionId = newRegion.id;
    }

    // Step 4: Create shipping options
    await createShippingOptions(sessionCookie, regionId);

    // Step 5: Update product pricing
    await updateProductPricing(sessionCookie, regionId);

    // Step 6: Update store currencies
    await updateStoreCurrencies(sessionCookie);

    console.log('\n==================================');
    console.log('🎉 US Region setup complete!');
    console.log(`📋 Region ID: ${regionId}`);
    console.log('💡 Next steps:');
    console.log('1. Update fabric-store to use the new region ID');
    console.log('2. Test checkout flow with USD pricing');
    console.log('3. Configure Stripe for USD payments');
    console.log('\n⚠️ Important: Update your .env files:');
    console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID=${regionId}`);
    console.log('NEXT_PUBLIC_MEDUSA_CURRENCY_CODE=usd');

  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}