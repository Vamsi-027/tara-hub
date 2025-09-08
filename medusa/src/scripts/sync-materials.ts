/**
 * Simple Bulk Sync Script for Materials
 * Syncs all fabrics from admin to materials table (optimized for 1000 records)
 */

import { Client } from "pg"

async function syncMaterials() {
  console.log("🔄 Starting materials sync...")
  const startTime = Date.now()

  // Connect to admin database
  const adminDb = new Client({
    connectionString: process.env.ADMIN_DATABASE_URL || 
                     process.env.DATABASE_URL ||
                     process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === "production" ? {
      rejectUnauthorized: false
    } : undefined
  })

  // Connect to Medusa database
  const medusaDb = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? {
      rejectUnauthorized: false
    } : undefined
  })

  try {
    await adminDb.connect()
    await medusaDb.connect()

    // Fetch all active fabrics from admin
    const { rows: fabrics } = await adminDb.query(`
      SELECT * FROM fabrics 
      WHERE deleted_at IS NULL 
      AND status = 'active'
      ORDER BY id
    `)

    console.log(`📦 Found ${fabrics.length} fabrics to sync`)

    // Prepare bulk upsert
    const values = fabrics.map(fabric => [
      fabric.id,
      fabric.name,
      JSON.stringify(fabric), // Entire record as properties
      new Date(),
      new Date()
    ])

    // Bulk UPSERT using unnest for performance
    if (values.length > 0) {
      const query = `
        INSERT INTO materials (id, name, properties, created_at, updated_at)
        SELECT * FROM unnest($1::text[], $2::text[], $3::jsonb[], $4::timestamp[], $5::timestamp[])
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          properties = EXCLUDED.properties,
          updated_at = EXCLUDED.updated_at
      `

      await medusaDb.query(query, [
        values.map(v => v[0]), // ids
        values.map(v => v[1]), // names
        values.map(v => v[2]), // properties
        values.map(v => v[3]), // created_at
        values.map(v => v[4])  // updated_at
      ])
    }

    const syncTime = Date.now() - startTime
    console.log(`✅ Synced ${fabrics.length} materials in ${syncTime}ms`)

    // Log some stats
    const { rows: [stats] } = await medusaDb.query(`
      SELECT 
        COUNT(*) as total,
        pg_size_pretty(SUM(pg_column_size(properties))) as data_size
      FROM materials
    `)
    
    console.log(`📊 Stats: ${stats.total} materials, ${stats.data_size} total size`)

  } catch (error) {
    console.error("❌ Sync failed:", error)
    throw error
  } finally {
    await adminDb.end()
    await medusaDb.end()
  }
}

// Run if called directly
if (require.main === module) {
  syncMaterials()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { syncMaterials }