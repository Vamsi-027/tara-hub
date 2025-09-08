import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

export default async () => {
  console.log('🔍 Verifying order sources: File vs Database\n')
  console.log('=' .repeat(60))
  
  try {
    // 1. Check orders in file storage
    const fabricOrdersFile = path.join(process.cwd(), '../frontend/experiences/fabric-store/.orders.json')
    const fileOrders = JSON.parse(fs.readFileSync(fabricOrdersFile, 'utf-8'))
    
    console.log('📁 FILE STORAGE (.orders.json):')
    console.log(`   Total orders: ${fileOrders.length}`)
    
    const fileOrderIds = fileOrders.map((o: any) => o.id)
    console.log('\n   Order IDs in file:')
    fileOrderIds.forEach((id: string) => {
      const order = fileOrders.find((o: any) => o.id === id)
      const hasDbStorage = order.timeline?.some((t: any) => t.status === 'database_stored')
      const hasDbError = order.timeline?.some((t: any) => t.status === 'database_error')
      
      let status = '❓'
      if (hasDbStorage) status = '✅ DB stored'
      else if (hasDbError) status = '❌ DB failed'
      
      console.log(`   - ${id} (${status})`)
    })
    
    // 2. Check orders in database
    console.log('\n' + '=' .repeat(60))
    console.log('🗄️  DATABASE (PostgreSQL):')
    
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      console.log('   ❌ DATABASE_URL not configured')
      return
    }
    
    const client = new Client({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
    })
    
    await client.connect()
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'fabric_orders'
      )
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('   ❌ Table "fabric_orders" does not exist')
      await client.end()
      return
    }
    
    // Get all orders from database
    const result = await client.query(`
      SELECT id, email, status, total_amount, created_at 
      FROM fabric_orders 
      ORDER BY created_at DESC
    `)
    
    console.log(`   Total orders: ${result.rows.length}`)
    
    if (result.rows.length > 0) {
      console.log('\n   Order IDs in database:')
      result.rows.forEach((row: any) => {
        const inFile = fileOrderIds.includes(row.id) ? '📁' : '❌'
        console.log(`   - ${row.id} (${inFile} in file)`)
      })
    }
    
    // 3. Compare and analyze
    console.log('\n' + '=' .repeat(60))
    console.log('📊 ANALYSIS:')
    
    const dbOrderIds = result.rows.map((r: any) => r.id)
    
    // Orders in file but not in database
    const missingInDb = fileOrderIds.filter((id: string) => !dbOrderIds.includes(id))
    console.log(`\n   Orders in FILE but NOT in DATABASE: ${missingInDb.length}`)
    if (missingInDb.length > 0) {
      missingInDb.forEach((id: string) => {
        console.log(`   ❌ ${id} - Not in database`)
      })
    }
    
    // Orders in database but not in file
    const missingInFile = dbOrderIds.filter((id: string) => !fileOrderIds.includes(id))
    console.log(`\n   Orders in DATABASE but NOT in FILE: ${missingInFile.length}`)
    if (missingInFile.length > 0) {
      missingInFile.forEach((id: string) => {
        console.log(`   ⚠️  ${id} - Not in file (might be deleted)`)
      })
    }
    
    // Successfully synced orders
    const syncedOrders = fileOrderIds.filter((id: string) => dbOrderIds.includes(id))
    console.log(`\n   Orders in BOTH (synced): ${syncedOrders.length}`)
    
    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('📈 SUMMARY:')
    console.log(`   ✅ Successfully synced: ${syncedOrders.length} orders`)
    console.log(`   ❌ Missing in database: ${missingInDb.length} orders`)
    console.log(`   ⚠️  Database-only orders: ${missingInFile.length} orders`)
    
    // Current data source for admin dashboard
    console.log('\n' + '=' .repeat(60))
    console.log('🎯 ADMIN DASHBOARD DATA SOURCE:')
    console.log('   The Medusa admin dashboard at /app/orders shows:')
    console.log('   📁 Data from: FILE STORAGE (.orders.json)')
    console.log('   🔄 Via proxy: /admin/fabric-orders → fabric-store API → .orders.json')
    console.log('\n   However, orders are ALSO being saved to database now.')
    console.log('   Both storage systems are active (dual storage).')
    
    await client.end()
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}