#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { drizzle } = require('drizzle-orm/neon-http')
const { neon } = require('@neondatabase/serverless')

// Use the production DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment')
  process.exit(1)
}

async function seedRegion() {
  console.log('🌍 Seeding region directly to database...\n')

  try {
    const sql = neon(DATABASE_URL)
    const db = drizzle(sql)

    // Check if region table exists and what regions are there
    console.log('1. Checking existing regions...')

    const existingRegions = await sql`
      SELECT id, name, currency_code
      FROM region
      LIMIT 10
    `.catch(() => [])

    if (existingRegions && existingRegions.length > 0) {
      console.log(`   ✅ Found ${existingRegions.length} existing regions:`)
      existingRegions.forEach(r => {
        console.log(`      - ${r.name} (${r.id}) - ${r.currency_code}`)
      })
      console.log('\n✅ Regions already exist!')
      return
    }

    console.log('   No regions found.\n')

    // Create a new region
    console.log('2. Creating US region...')

    const regionId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await sql`
      INSERT INTO region (
        id,
        name,
        currency_code,
        tax_rate,
        tax_code,
        gift_cards_taxable,
        automatic_taxes,
        created_at,
        updated_at
      ) VALUES (
        ${regionId},
        'United States',
        'usd',
        0,
        NULL,
        true,
        false,
        NOW(),
        NOW()
      )
    `

    console.log('   ✅ Region created:', regionId)

    // Add US country to the region
    console.log('\n3. Adding US country to region...')

    await sql`
      INSERT INTO region_country (
        region_id,
        iso_2
      ) VALUES (
        ${regionId},
        'us'
      ) ON CONFLICT DO NOTHING
    `

    console.log('   ✅ Country added')

    // Add payment provider
    console.log('\n4. Adding payment providers...')

    await sql`
      INSERT INTO region_payment_provider (
        region_id,
        provider_id
      ) VALUES (
        ${regionId},
        'pp_stripe_stripe'
      ) ON CONFLICT DO NOTHING
    `

    console.log('   ✅ Payment provider added')

    // Add fulfillment provider
    console.log('\n5. Adding fulfillment providers...')

    await sql`
      INSERT INTO region_fulfillment_provider (
        region_id,
        provider_id
      ) VALUES (
        ${regionId},
        'manual'
      ) ON CONFLICT DO NOTHING
    `

    console.log('   ✅ Fulfillment provider added')

    console.log('\n✨ Region seeding complete!')
    console.log(`\nRegion ID: ${regionId}`)
    console.log('You should now be able to create orders and use the region in your store.')

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.detail) {
      console.error('   Details:', error.detail)
    }
  }
}

seedRegion()