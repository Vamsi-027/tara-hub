#!/usr/bin/env node
/**
 * Production Fix for Stripe Payment Provider
 *
 * This script directly updates the production database to ensure
 * the USD region has the Stripe payment provider configured.
 *
 * Run with: NODE_ENV=production node scripts/fix-stripe-production.js
 */

const { Client } = require('pg')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function fixStripeInProduction() {
  console.log('🚀 Production Stripe Payment Provider Fix')
  console.log('==========================================')

  // Use production database URL
  const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment')
    process.exit(1)
  }

  // Mask the database URL for logging
  const maskedUrl = DATABASE_URL.replace(/:[^:@]+@/, ':****@')
  console.log(`📊 Connecting to database: ${maskedUrl.substring(0, 50)}...`)

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    await client.connect()
    console.log('✅ Connected to production database')

    // Step 1: Find the USD region
    console.log('\n🔍 Finding USD region...')
    const regionQuery = `
      SELECT id, name, currency_code
      FROM "region"
      WHERE currency_code = 'usd'
      LIMIT 1
    `
    const regionResult = await client.query(regionQuery)

    if (regionResult.rows.length === 0) {
      console.error('❌ No USD region found in production!')
      process.exit(1)
    }

    const region = regionResult.rows[0]
    console.log(`✅ Found region: ${region.id} - ${region.name} (${region.currency_code})`)

    // Step 2: Check if Stripe provider exists
    console.log('\n🔍 Checking for Stripe provider...')
    const providerQuery = `
      SELECT id, is_enabled
      FROM "payment_provider"
      WHERE id = 'stripe'
      LIMIT 1
    `
    const providerResult = await client.query(providerQuery)

    if (providerResult.rows.length === 0) {
      console.log('⚠️ Stripe provider not found, creating...')

      // Create Stripe provider if it doesn't exist
      const createProviderQuery = `
        INSERT INTO "payment_provider" (id, is_enabled, created_at, updated_at)
        VALUES ('stripe', true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
        SET is_enabled = true, updated_at = NOW()
        RETURNING id
      `
      await client.query(createProviderQuery)
      console.log('✅ Created Stripe payment provider')
    } else {
      const provider = providerResult.rows[0]
      console.log(`✅ Stripe provider exists (enabled: ${provider.is_enabled})`)

      if (!provider.is_enabled) {
        console.log('🔄 Enabling Stripe provider...')
        await client.query(`
          UPDATE "payment_provider"
          SET is_enabled = true, updated_at = NOW()
          WHERE id = 'stripe'
        `)
        console.log('✅ Enabled Stripe provider')
      }
    }

    // Step 3: Check current region payment providers
    console.log('\n🔍 Checking current region payment providers...')
    const currentProvidersQuery = `
      SELECT provider_id
      FROM "region_payment_provider"
      WHERE region_id = $1
    `
    const currentProvidersResult = await client.query(currentProvidersQuery, [region.id])
    const currentProviders = currentProvidersResult.rows.map(row => row.provider_id)
    console.log(`Current providers: ${currentProviders.length > 0 ? currentProviders.join(', ') : 'None'}`)

    // Step 4: Add Stripe to region if not present
    if (!currentProviders.includes('stripe')) {
      console.log('\n➕ Adding Stripe provider to USD region...')

      const addProviderQuery = `
        INSERT INTO "region_payment_provider" (region_id, provider_id)
        VALUES ($1, 'stripe')
        ON CONFLICT (region_id, provider_id) DO NOTHING
      `
      await client.query(addProviderQuery, [region.id])
      console.log('✅ Added Stripe provider to USD region')
    } else {
      console.log('✅ Stripe provider already configured for USD region')
    }

    // Step 5: Verify the configuration
    console.log('\n✅ Verifying final configuration...')
    const verifyQuery = `
      SELECT rpp.provider_id, pp.is_enabled
      FROM "region_payment_provider" rpp
      JOIN "payment_provider" pp ON pp.id = rpp.provider_id
      WHERE rpp.region_id = $1
    `
    const verifyResult = await client.query(verifyQuery, [region.id])

    console.log('Final payment providers for USD region:')
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.provider_id} (enabled: ${row.is_enabled})`)
    })

    const hasStripe = verifyResult.rows.some(row => row.provider_id === 'stripe' && row.is_enabled)

    if (hasStripe) {
      console.log('\n🎉 SUCCESS: Stripe is now properly configured for USD region!')
      console.log('💳 Payment sessions should now work correctly in production.')
    } else {
      console.error('\n❌ FAILED: Stripe provider configuration incomplete')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Error during execution:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n📊 Database connection closed')
  }
}

// Run the script
if (require.main === module) {
  console.log('🏁 Starting production fix...\n')
  fixStripeInProduction()
    .then(() => {
      console.log('\n✨ Script completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { fixStripeInProduction }