import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

/**
 * Sync Materials from Admin Fabrics
 * 
 * Reads fabric composition data from admin database and populates
 * the materials table with unique material names.
 * 
 * Usage: npm run sync:materials
 */
export default async function syncMaterialsFromFabrics({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const materialsService = container.resolve("materialsModuleService")
  
  logger.info("🔄 Starting materials sync from admin fabrics...")
  
  // Connect to admin database
  const adminDb = new Client({
    connectionString: process.env.ADMIN_DATABASE_URL || 
                     process.env.DATABASE_URL ||
                     process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === "production" ? {
      rejectUnauthorized: false
    } : undefined
  })
  
  try {
    await adminDb.connect()
    logger.info("✅ Connected to admin database")
    
    // Query all fabrics with fiber_content
    const result = await adminDb.query(`
      SELECT 
        id,
        name,
        fiber_content,
        composition
      FROM fabrics 
      WHERE deleted_at IS NULL
      AND (fiber_content IS NOT NULL OR composition IS NOT NULL)
    `)
    
    logger.info(`📊 Found ${result.rows.length} fabrics with composition data`)
    
    // Extract unique material names
    const allMaterials = new Set<string>()
    
    for (const fabric of result.rows) {
      // Try fiber_content field first (structured data)
      if (fabric.fiber_content) {
        try {
          const fiberContent = typeof fabric.fiber_content === 'string' 
            ? JSON.parse(fabric.fiber_content) 
            : fabric.fiber_content
            
          if (Array.isArray(fiberContent)) {
            fiberContent.forEach((fiber: any) => {
              if (fiber.material) {
                allMaterials.add(fiber.material.trim())
              }
            })
          }
        } catch (e) {
          // If not valid JSON, try parsing as string
          const materials = materialsService.parseMaterialNames(fabric.fiber_content)
          materials.forEach(m => allMaterials.add(m))
        }
      }
      
      // Also check composition field (text description)
      if (fabric.composition) {
        const materials = materialsService.parseMaterialNames(fabric.composition)
        materials.forEach(m => allMaterials.add(m))
      }
    }
    
    logger.info(`📝 Found ${allMaterials.size} unique materials`)
    
    // Sync materials to database
    let created = 0
    let existing = 0
    
    for (const materialName of allMaterials) {
      try {
        // Check if exists
        const materials = await materialsService.listMaterials({
          filters: { name: materialName }
        })
        
        if (materials.length === 0) {
          await materialsService.createMaterials({
            name: materialName
          })
          created++
          logger.info(`✅ Created material: ${materialName}`)
        } else {
          existing++
        }
      } catch (error) {
        logger.error(`❌ Failed to create material "${materialName}":`, error)
      }
    }
    
    logger.info(`
========================================
✨ Materials sync completed!
========================================
📊 Total unique materials: ${allMaterials.size}
✅ Created: ${created}
📌 Already existed: ${existing}
========================================
    `)
    
  } catch (error) {
    logger.error("❌ Sync failed:", error)
    throw error
  } finally {
    await adminDb.end()
  }
}