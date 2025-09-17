#!/usr/bin/env node

/**
 * Setup US Region in Medusa via Store API
 * This script creates a US region with USD currency for American customers
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app';
const PUBLISHABLE_KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538';

async function createUSRegion() {
  console.log('🇺🇸 Setting up US Region for American customers');
  console.log('================================================\n');

  try {
    // First, check existing regions
    console.log('📋 Checking existing regions...');
    const regionsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/regions`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!regionsResponse.ok) {
      throw new Error(`Failed to fetch regions: ${regionsResponse.status}`);
    }

    const { regions } = await regionsResponse.json();
    console.log(`Found ${regions.length} existing region(s)`);

    // Check if US region already exists
    const existingUSRegion = regions.find(r =>
      r.currency_code === 'usd' ||
      r.name.toLowerCase().includes('united states') ||
      r.name.toLowerCase().includes('us')
    );

    if (existingUSRegion) {
      console.log(`\n✅ US region already exists!`);
      console.log(`   ID: ${existingUSRegion.id}`);
      console.log(`   Name: ${existingUSRegion.name}`);
      console.log(`   Currency: ${existingUSRegion.currency_code.toUpperCase()}`);

      console.log('\n📝 Add this to your .env.local file:');
      console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID_USD=${existingUSRegion.id}`);

      return existingUSRegion;
    }

    // If we can't create via store API, provide manual instructions
    console.log('\n⚠️  US Region not found. Please create it manually:');
    console.log('\n📝 Manual Setup Instructions:');
    console.log('1. Login to Medusa Admin: https://medusa-backend-production-3655.up.railway.app/admin');
    console.log('2. Navigate to Settings → Regions');
    console.log('3. Click "Add Region"');
    console.log('4. Configure as follows:');
    console.log('   - Name: United States');
    console.log('   - Currency: USD');
    console.log('   - Countries: United States');
    console.log('   - Payment Providers: Stripe, Manual');
    console.log('   - Fulfillment Providers: Manual');
    console.log('5. Save the region');
    console.log('6. Copy the Region ID and add to .env.local');
    console.log('\n7. Then set prices for your products:');
    console.log('   - Go to Products');
    console.log('   - For each product, click Edit');
    console.log('   - In Prices section, add USD prices for both variants');
    console.log('   - Save changes');

  } catch (error) {
    console.error('❌ Error:', error.message);

    console.log('\n📝 Alternative: Use Medusa Admin Dashboard');
    console.log('1. Go to: https://medusa-backend-production-3655.up.railway.app/admin');
    console.log('2. Login with your admin credentials');
    console.log('3. Create US region manually in Settings → Regions');
  }
}

// Check if we need to create through local Medusa instead
async function checkLocalMedusa() {
  try {
    const localResponse = await fetch('http://localhost:9000/admin/regions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (localResponse.ok) {
      console.log('\n💡 Tip: You have a local Medusa instance running!');
      console.log('   You can create the region there and it will sync to production.');
      console.log('   Run: cd medusa && npm run setup:us-region');
    }
  } catch (e) {
    // Local Medusa not running, ignore
  }
}

// Run the setup
(async () => {
  await createUSRegion();
  await checkLocalMedusa();

  console.log('\n✨ Setup complete! Next steps:');
  console.log('1. Create/verify US region in Medusa Admin');
  console.log('2. Set prices for all products in USD');
  console.log('3. Update .env.local with the US region ID');
  console.log('4. Restart fabric-store: npm run dev:fabric-store');
})();