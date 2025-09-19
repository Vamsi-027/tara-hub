#!/usr/bin/env node
/**
 * Fix Incorrect Stripe Payment Provider ID
 *
 * This script fixes the issue where the region has 'pp_stripe_stripe'
 * instead of 'stripe' as the payment provider ID.
 */

const { Client } = require('pg')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function fixStripeProviderId() {
  console.log('🚀 Fixing Stripe Payment Provider ID')
  console.log('==========================================')

  const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment')
    process.exit(1)
  }

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
    console.log('✅ Connected to database')

    // Step 1: Check current incorrect provider entries
    console.log('\n🔍 Checking for incorrect provider IDs...')
    const checkQuery = `
      SELECT region_id, payment_provider_id, id
      FROM "region_payment_provider"
      WHERE payment_provider_id = 'pp_stripe_stripe'
    `
    const checkResult = await client.query(checkQuery)

    if (checkResult.rows.length === 0) {
      console.log('✅ No incorrect provider IDs found')
    } else {
      console.log(`❌ Found ${checkResult.rows.length} incorrect entries:`)
      checkResult.rows.forEach(row => {
        console.log(`  - Region: ${row.region_id}, Provider: ${row.payment_provider_id}`)
      })

      // Step 2: Delete incorrect entries
      console.log('\n🗑️ Removing incorrect entries...')
      const deleteQuery = `
        DELETE FROM "region_payment_provider"
        WHERE payment_provider_id = 'pp_stripe_stripe'
      `
      const deleteResult = await client.query(deleteQuery)
      console.log(`✅ Removed ${deleteResult.rowCount} incorrect entries`)
    }

    // Step 3: Ensure 'stripe' provider exists
    console.log('\n🔍 Checking for Stripe provider...')
    const providerQuery = `
      SELECT id, is_enabled
      FROM "payment_provider"
      WHERE id = 'stripe'
    `
    const providerResult = await client.query(providerQuery)

    if (providerResult.rows.length === 0) {
      console.log('⚠️ Creating Stripe provider...')
      const createProviderQuery = `
        INSERT INTO "payment_provider" (id, is_enabled, created_at, updated_at)
        VALUES ('stripe', true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
        SET is_enabled = true, updated_at = NOW()
      `
      await client.query(createProviderQuery)
      console.log('✅ Created Stripe provider')
    } else {
      console.log(`✅ Stripe provider exists (enabled: ${providerResult.rows[0].is_enabled})`)
    }

    // Step 4: Get the USD region
    console.log('\n🔍 Finding USD region...')
    const regionQuery = `
      SELECT id, name, currency_code
      FROM "region"
      WHERE currency_code = 'usd'
      LIMIT 1
    `
    const regionResult = await client.query(regionQuery)

    if (regionResult.rows.length === 0) {
      console.error('❌ No USD region found!')
      process.exit(1)
    }

    const region = regionResult.rows[0]
    console.log(`✅ Found region: ${region.id} - ${region.name}`)

    // Step 5: Check if correct Stripe provider is already linked
    console.log('\n🔍 Checking for correct Stripe provider link...')
    const correctLinkQuery = `
      SELECT * FROM "region_payment_provider"
      WHERE region_id = $1 AND payment_provider_id = 'stripe'
    `
    const correctLinkResult = await client.query(correctLinkQuery, [region.id])

    if (correctLinkResult.rows.length === 0) {
      // Step 6: Add correct Stripe provider to region
      console.log('➕ Adding correct Stripe provider to USD region...')

      // Generate a new ID for the relationship
      const idPrefix = 'regpp_'
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 15)
      const newId = `${idPrefix}${timestamp}${random}`.toUpperCase()

      const addProviderQuery = `
        INSERT INTO "region_payment_provider"
        (id, region_id, payment_provider_id, created_at, updated_at)
        VALUES ($1, $2, 'stripe', NOW(), NOW())
        ON CONFLICT (region_id, payment_provider_id) DO NOTHING
      `
      await client.query(addProviderQuery, [newId, region.id])
      console.log('✅ Added correct Stripe provider to USD region')
    } else {
      console.log('✅ Correct Stripe provider already linked to USD region')
    }

    // Step 7: Final verification
    console.log('\n🔍 Final verification...')
    const verifyQuery = `
      SELECT rpp.payment_provider_id, pp.is_enabled
      FROM "region_payment_provider" rpp
      JOIN "payment_provider" pp ON pp.id = rpp.payment_provider_id
      WHERE rpp.region_id = $1
    `
    const verifyResult = await client.query(verifyQuery, [region.id])

    console.log('Payment providers for USD region:')
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.payment_provider_id} (enabled: ${row.is_enabled})`)
    })

    const hasCorrectStripe = verifyResult.rows.some(
      row => row.payment_provider_id === 'stripe' && row.is_enabled
    )

    if (hasCorrectStripe) {
      console.log('\n🎉 SUCCESS: Stripe provider ID has been fixed!')
      console.log('💳 Payment sessions should now work correctly.')
    } else {
      console.error('\n❌ FAILED: Stripe provider not properly configured')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n📊 Database connection closed')
  }
}

// Run the script
if (require.main === module) {
  console.log('🏁 Starting fix...\n')
  fixStripeProviderId()
    .then(() => {
      console.log('\n✨ Script completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { fixStripeProviderId }