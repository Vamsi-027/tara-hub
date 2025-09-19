#!/usr/bin/env node
/**
 * List All Regions in Database
 */

const { Client } = require('pg')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function listAllRegions() {
  const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment')
    process.exit(1)
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    await client.connect()
    console.log('🔍 Fetching all regions from database...\n')

    const query = `
      SELECT
        r.id,
        r.name,
        r.currency_code,
        r.created_at,
        r.updated_at,
        r.metadata,
        (
          SELECT COUNT(*)
          FROM region_payment_provider rpp
          WHERE rpp.region_id = r.id
        ) as payment_provider_count,
        (
          SELECT array_agg(c.iso_2)
          FROM region_country rc
          JOIN country c ON c.iso_2 = rc.iso_2
          WHERE rc.region_id = r.id
        ) as countries
      FROM region r
      WHERE r.deleted_at IS NULL
      ORDER BY r.created_at DESC
    `

    const result = await client.query(query)

    console.log(`Found ${result.rows.length} region(s):\n`)
    console.log('=====================================')

    result.rows.forEach((region, index) => {
      console.log(`\nRegion ${index + 1}:`)
      console.log(`  ID: ${region.id}`)
      console.log(`  Name: ${region.name}`)
      console.log(`  Currency: ${region.currency_code}`)
      console.log(`  Tax Rate: ${region.tax_rate || 0}%`)
      console.log(`  Countries: ${region.countries ? region.countries.join(', ') : 'None'}`)
      console.log(`  Payment Providers: ${region.payment_provider_count} configured`)
      console.log(`  Created: ${new Date(region.created_at).toLocaleString()}`)
      console.log(`  Updated: ${new Date(region.updated_at).toLocaleString()}`)
      if (region.metadata) {
        console.log(`  Metadata: ${JSON.stringify(region.metadata)}`)
      }
      console.log('-------------------------------------')
    })

    // Check for the most recent region
    if (result.rows.length > 0) {
      const newestRegion = result.rows[0]
      console.log(`\n🌟 Most Recent Region:`)
      console.log(`   ID: ${newestRegion.id}`)
      console.log(`   Name: ${newestRegion.name}`)
      console.log(`   Created: ${new Date(newestRegion.created_at).toLocaleString()}`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
  }
}

// Run the script
if (require.main === module) {
  listAllRegions()
}

module.exports = { listAllRegions }