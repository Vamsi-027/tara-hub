#!/usr/bin/env node
/**
 * FABRICS TO MATERIALS SYNC SCRIPT
 * Syncs fabrics from neondb.fabrics table to medusa.materials table
 * 
 * Usage:
 *   npm run sync:materials -- --dry-run    # Test mode without creating materials
 *   npm run sync:materials                 # Full sync
 *   npm run sync:materials -- --limit=10   # Sync only first 10 fabrics
 *   npm run sync:materials -- --id=fabric-123 # Sync specific fabric by ID
 * 
 * Environment Variables Required:
 *   - NEON_DATABASE_URL: Connection to neondb (source)
 *   - MEDUSA_DATABASE_URL: Connection to medusa database (target)
 */

import postgres from 'postgres'
import * as fs from 'fs/promises'
import { parseArgs } from 'util'

// Types
interface Fabric {
  id: string
  sku: string
  name: string
  description?: string
  yardage_price?: number
  swatch_price?: number
  images?: any
  cdn_urls?: any
  category?: string
  collection?: string
  is_active: boolean
  brand?: string
  material?: string
  width?: number
  pattern?: string
  colors?: any
  color_family?: string
  stock_unit?: string
  fiber_content?: string
  cleaning_code?: string
  martindale?: number
  stain_resistant?: boolean
  fade_resistant?: boolean
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

interface Material {
  id: string
  name: string
  properties: Record<string, any>
  created_at?: Date
  updated_at?: Date
}

interface SyncResult {
  id: string
  name: string
  status: 'created' | 'updated' | 'skipped' | 'failed'
  error?: string
}

interface SyncStats {
  total: number
  created: number
  updated: number
  skipped: number
  failed: number
  startTime: Date
  endTime?: Date
  duration?: number
  results: SyncResult[]
}

// Configuration
const config = {
  neonDbUrl: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || '',
  medusaDbUrl: process.env.MEDUSA_DATABASE_URL || process.env.DATABASE_URL || '',
  batchSize: parseInt(process.env.BATCH_SIZE || '50'),
  logFile: './materials-sync-log.txt',
  resultsFile: './materials-sync-results.json',
}

// Logger
class Logger {
  private logStream?: fs.FileHandle

  async init() {
    try {
      this.logStream = await fs.open(config.logFile, 'a')
    } catch (error) {
      console.error('Failed to open log file:', error)
    }
  }

  async log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] [${level}] ${message}`
    
    console.log(logEntry, data ? data : '')
    
    if (this.logStream) {
      const fullLog = data 
        ? `${logEntry} ${JSON.stringify(data)}\n`
        : `${logEntry}\n`
      await this.logStream.write(fullLog)
    }
  }

  async close() {
    if (this.logStream) {
      await this.logStream.close()
    }
  }
}

// Main Sync Class
class FabricMaterialSync {
  private logger: Logger
  private neonSql: any
  private medusaSql: any
  private stats: SyncStats

  constructor() {
    this.logger = new Logger()
    this.stats = {
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      startTime: new Date(),
      results: []
    }
  }

  async run(options: {
    dryRun?: boolean
    limit?: number
    id?: string
  }) {
    try {
      await this.logger.init()
      await this.logger.log('INFO', 'Starting fabric to materials sync', options)

      // Validate configuration
      this.validateConfig()

      // Initialize database connections
      await this.initDatabases()

      // Fetch fabrics from source
      const fabrics = await this.fetchFabrics(options.id, options.limit)
      this.stats.total = fabrics.length
      await this.logger.log('INFO', `Found ${fabrics.length} fabrics to sync`)

      // Process each fabric
      for (let i = 0; i < fabrics.length; i++) {
        const fabric = fabrics[i]
        
        if (i % 10 === 0 && i > 0) {
          await this.logger.log('INFO', `Progress: ${i}/${fabrics.length}`)
        }

        const result = await this.processFabric(fabric, options.dryRun || false)
        this.stats.results.push(result)

        // Update statistics
        if (result.status === 'created') this.stats.created++
        else if (result.status === 'updated') this.stats.updated++
        else if (result.status === 'skipped') this.stats.skipped++
        else if (result.status === 'failed') this.stats.failed++
      }

      // Finalize
      this.stats.endTime = new Date()
      this.stats.duration = (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000

      // Save results
      await this.saveResults()

      // Log summary
      await this.logSummary()

    } catch (error) {
      await this.logger.log('ERROR', 'Sync failed', error)
      throw error
    } finally {
      // Clean up
      if (this.neonSql) await this.neonSql.end()
      if (this.medusaSql) await this.medusaSql.end()
      await this.logger.close()
    }
  }

  private validateConfig() {
    if (!config.neonDbUrl) {
      throw new Error('NEON_DATABASE_URL environment variable is required')
    }
    if (!config.medusaDbUrl) {
      throw new Error('MEDUSA_DATABASE_URL environment variable is required')
    }
  }

  private async initDatabases() {
    // Initialize source database (neondb)
    const neonUrl = config.neonDbUrl.includes('sslmode=') 
      ? config.neonDbUrl 
      : config.neonDbUrl + (config.neonDbUrl.includes('?') ? '&' : '?') + 'sslmode=require'
    
    this.neonSql = postgres(neonUrl)
    
    // Initialize target database (medusa)
    const medusaUrl = config.medusaDbUrl.includes('sslmode=') 
      ? config.medusaDbUrl 
      : config.medusaDbUrl + (config.medusaDbUrl.includes('?') ? '&' : '?') + 'sslmode=require'
    
    this.medusaSql = postgres(medusaUrl)
    
    await this.logger.log('INFO', 'Database connections initialized')
  }

  private async fetchFabrics(specificId?: string, limit?: number): Promise<Fabric[]> {
    let query = this.neonSql`
      SELECT 
        id, sku, name, description, yardage_price, swatch_price,
        images, cdn_urls, category, collection, is_active,
        brand, material, width, pattern, colors, color_family,
        stock_unit, fiber_content, cleaning_code, martindale,
        stain_resistant, fade_resistant, created_at, updated_at
      FROM fabrics
      WHERE deleted_at IS NULL
    `

    if (specificId) {
      query = this.neonSql`${query} AND id = ${specificId}`
    }

    query = this.neonSql`${query} ORDER BY created_at DESC`

    if (limit) {
      query = this.neonSql`${query} LIMIT ${limit}`
    }

    const results = await query
    return results as Fabric[]
  }

  private async processFabric(fabric: Fabric, dryRun: boolean): Promise<SyncResult> {
    try {
      // Transform fabric to material format
      const material = this.transformFabricToMaterial(fabric)

      if (dryRun) {
        await this.logger.log('INFO', `[DRY RUN] Would sync fabric: ${fabric.name}`, {
          id: fabric.id,
          sku: fabric.sku,
          material
        })
        
        return {
          id: fabric.id,
          name: fabric.name,
          status: 'skipped'
        }
      }

      // Check if material already exists
      const existing = await this.medusaSql`
        SELECT id, name, properties 
        FROM materials 
        WHERE id = ${fabric.id}
      `

      if (existing.length > 0) {
        // Update existing material
        await this.medusaSql`
          UPDATE materials 
          SET 
            name = ${material.name},
            properties = ${material.properties},
            updated_at = ${new Date()}
          WHERE id = ${fabric.id}
        `
        
        await this.logger.log('INFO', `Updated material: ${fabric.name}`)
        
        return {
          id: fabric.id,
          name: fabric.name,
          status: 'updated'
        }
      } else {
        // Create new material
        await this.medusaSql`
          INSERT INTO materials (id, name, properties, created_at, updated_at)
          VALUES (
            ${material.id},
            ${material.name},
            ${material.properties},
            ${new Date()},
            ${new Date()}
          )
        `
        
        await this.logger.log('INFO', `Created material: ${fabric.name}`)
        
        return {
          id: fabric.id,
          name: fabric.name,
          status: 'created'
        }
      }
    } catch (error: any) {
      await this.logger.log('ERROR', `Failed to process fabric: ${fabric.name}`, error)
      
      return {
        id: fabric.id,
        name: fabric.name,
        status: 'failed',
        error: error.message
      }
    }
  }

  private transformFabricToMaterial(fabric: Fabric): Material {
    // Create properties object with all fabric data
    const properties: Record<string, any> = {
      sku: fabric.sku,
      description: fabric.description,
      category: fabric.category,
      collection: fabric.collection,
      brand: fabric.brand,
      material: fabric.material,
      pattern: fabric.pattern,
      colors: fabric.colors,
      color_family: fabric.color_family,
      is_active: fabric.is_active,
      
      // Pricing
      pricing: {
        yardage_price: fabric.yardage_price,
        swatch_price: fabric.swatch_price,
        stock_unit: fabric.stock_unit
      },
      
      // Physical properties
      physical: {
        width: fabric.width,
        fiber_content: fabric.fiber_content,
        cleaning_code: fabric.cleaning_code
      },
      
      // Performance properties
      performance: {
        martindale: fabric.martindale,
        stain_resistant: fabric.stain_resistant,
        fade_resistant: fabric.fade_resistant
      },
      
      // Media
      media: {
        images: fabric.images,
        cdn_urls: fabric.cdn_urls
      },
      
      // Metadata
      source: 'neondb',
      synced_at: new Date().toISOString(),
      original_created_at: fabric.created_at,
      original_updated_at: fabric.updated_at
    }

    return {
      id: fabric.id, // Use same ID for easy reference
      name: fabric.name,
      properties
    }
  }

  private async saveResults() {
    try {
      await fs.writeFile(
        config.resultsFile,
        JSON.stringify(this.stats, null, 2)
      )
      await this.logger.log('INFO', `Results saved to ${config.resultsFile}`)
    } catch (error) {
      await this.logger.log('ERROR', 'Failed to save results', error)
    }
  }

  private async logSummary() {
    const summary = `
============================================================
SYNC SUMMARY
============================================================
Total Fabrics:    ${this.stats.total}
Created:          ${this.stats.created}
Updated:          ${this.stats.updated}
Skipped:          ${this.stats.skipped}
Failed:           ${this.stats.failed}
Duration:         ${this.stats.duration?.toFixed(2)} seconds
============================================================
`
    console.log(summary)
    
    if (this.stats.failed > 0) {
      console.log('\nFailed items:')
      this.stats.results
        .filter(r => r.status === 'failed')
        .forEach(r => {
          console.log(`  - ${r.name} (${r.id}): ${r.error}`)
        })
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  
  const options = {
    dryRun: args.includes('--dry-run'),
    limit: undefined as number | undefined,
    id: undefined as string | undefined,
  }

  // Parse limit
  const limitArg = args.find(arg => arg.startsWith('--limit='))
  if (limitArg) {
    options.limit = parseInt(limitArg.split('=')[1])
  }

  // Parse ID
  const idArg = args.find(arg => arg.startsWith('--id='))
  if (idArg) {
    options.id = idArg.split('=')[1]
  }

  const sync = new FabricMaterialSync()
  await sync.run(options)
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Sync failed:', error)
    process.exit(1)
  })
}

export { FabricMaterialSync }