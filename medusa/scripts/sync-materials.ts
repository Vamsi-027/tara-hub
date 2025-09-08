import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

/**
 * Simple one-to-one sync from admin materials table to Medusa materials table
 * 
 * Usage: npm run sync:materials
 */
export default async function syncMaterials({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  
  logger.info("🔄 Starting materials sync...")
  
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
    
    // Get all materials from admin
    const result = await adminDb.query(`
      SELECT 
        id,
        name,
        properties,
        created_at,
        updated_at
      FROM materials
    `)
    
    logger.info(`📊 Found ${result.rows.length} materials to sync`)
    
    // Simple UPSERT for each material
    for (const material of result.rows) {
      await medusaDb.query(`
        INSERT INTO materials (id, name, properties, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          properties = EXCLUDED.properties,
          updated_at = EXCLUDED.updated_at
      `, [
        material.id,
        material.name,
        material.properties || {},
        material.created_at,
        material.updated_at
      ])
    }
    
    logger.info(`✅ Synced ${result.rows.length} materials`)
    
  } catch (error) {
    logger.error("❌ Sync failed:", error)
    throw error
  } finally {
    await adminDb.end()
    await medusaDb.end()
  }
}