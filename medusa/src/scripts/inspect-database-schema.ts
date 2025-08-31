/**
 * Database Schema Inspector
 * Connects to PostgreSQL and lists all tables and their structures
 * Specifically focuses on Medusa product-related tables
 */

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function inspectDatabaseSchema({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  
  // Get the database connection from MikroORM
  const manager = container.resolve("manager")
  
  logger.info("🔍 Starting database schema inspection...")
  
  try {
    // Get all table names
    const tablesQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename LIKE '%product%'
      OR tablename LIKE '%collection%'
      OR tablename LIKE '%category%'
      OR tablename LIKE '%variant%'
      OR tablename LIKE '%image%'
      OR tablename LIKE '%price%'
      OR tablename LIKE '%inventory%'
      ORDER BY tablename;
    `
    
    const tables = await manager.execute(tablesQuery)
    
    logger.info(`📊 Found ${tables.length} product-related tables:`)
    tables.forEach((table: any) => {
      logger.info(`  - ${table.tablename}`)
    })
    
    // Get detailed schema for each table
    for (const table of tables) {
      const tableName = table.tablename
      logger.info(`\n🔍 Inspecting table: ${tableName}`)
      
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = '${tableName}'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
      
      const columns = await manager.execute(columnsQuery)
      
      columns.forEach((col: any) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
        const length = col.character_maximum_length ? `(${col.character_maximum_length})` : ''
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''
        
        logger.info(`    ${col.column_name}: ${col.data_type}${length} ${nullable}${defaultVal}`)
      })
      
      // Get foreign keys
      const fkQuery = `
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = '${tableName}';
      `
      
      const foreignKeys = await manager.execute(fkQuery)
      if (foreignKeys.length > 0) {
        logger.info(`    📎 Foreign Keys:`)
        foreignKeys.forEach((fk: any) => {
          logger.info(`      ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`)
        })
      }
    }
    
    // Sample data from key product tables
    const keyTables = ['product', 'product_variant', 'product_collection', 'product_category']
    
    for (const tableName of keyTables) {
      try {
        const sampleQuery = `SELECT COUNT(*) as count FROM ${tableName}`
        const result = await manager.execute(sampleQuery)
        if (result[0]) {
          logger.info(`\n📈 Table ${tableName} has ${result[0].count} records`)
          
          if (result[0].count > 0) {
            // Get a few sample records
            const sampleRecords = await manager.execute(`SELECT * FROM ${tableName} LIMIT 3`)
            logger.info(`Sample records:`)
            sampleRecords.forEach((record: any, index: number) => {
              logger.info(`  Record ${index + 1}:`, JSON.stringify(record, null, 2))
            })
          }
        }
      } catch (error) {
        logger.warn(`Could not query table ${tableName}:`, error.message)
      }
    }
    
    logger.info("\n✅ Database schema inspection completed!")
    
  } catch (error) {
    logger.error("❌ Database inspection failed:", error)
    throw error
  }
}