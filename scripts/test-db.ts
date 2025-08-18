/**
 * Test database connection and list tables
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testDatabase() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found');
    process.exit(1);
  }

  console.log('🔄 Testing database connection...');
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL !== 'false' ? {
      rejectUnauthorized: false
    } : undefined,
  });

  try {
    // Test connection
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ Database connected successfully');
    
    // List existing tables
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log('\n📋 Existing tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });
    
    // Check if fabrics table exists
    const fabricsExists = tables.rows.some(row => row.tablename === 'fabrics');
    console.log(`\n🔍 Fabrics table exists: ${fabricsExists ? 'YES ✅' : 'NO ❌'}`);
    
    if (!fabricsExists) {
      console.log('\n📝 Creating fabrics tables...');
      
      // Create fabric_type enum
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE fabric_type AS ENUM (
            'Upholstery', 'Drapery', 'Multi-Purpose', 'Outdoor', 
            'Trim', 'Leather', 'Vinyl', 'Sheer', 'Blackout', 'Lining'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      
      // Create fabric_status enum
      await pool.query(`
        DO $$ BEGIN
          CREATE TYPE fabric_status AS ENUM (
            'Active', 'Discontinued', 'Out of Stock', 'Coming Soon', 'Sale', 'Clearance'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      
      // Create fabrics table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS fabrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sku VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE,
          description TEXT,
          type fabric_type NOT NULL,
          brand VARCHAR(100),
          collection VARCHAR(100),
          category VARCHAR(100),
          style VARCHAR(100),
          material VARCHAR(255),
          width NUMERIC(10, 2),
          weight NUMERIC(10, 2),
          pattern VARCHAR(100),
          colors JSONB DEFAULT '[]'::jsonb NOT NULL,
          color_family VARCHAR(50),
          retail_price NUMERIC(10, 2) NOT NULL,
          wholesale_price NUMERIC(10, 2),
          sale_price NUMERIC(10, 2),
          cost NUMERIC(10, 2),
          stock_quantity INTEGER DEFAULT 0 NOT NULL,
          stock_unit VARCHAR(20) DEFAULT 'yards' NOT NULL,
          low_stock_threshold INTEGER DEFAULT 10,
          images JSONB DEFAULT '[]'::jsonb NOT NULL,
          swatch_image VARCHAR(500),
          status fabric_status DEFAULT 'Active' NOT NULL,
          is_active BOOLEAN DEFAULT true NOT NULL,
          is_featured BOOLEAN DEFAULT false NOT NULL,
          meta_title VARCHAR(255),
          meta_description TEXT,
          specifications JSONB DEFAULT '{}'::jsonb NOT NULL,
          custom_fields JSONB DEFAULT '{}'::jsonb NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          created_by UUID,
          updated_by UUID,
          deleted_at TIMESTAMP,
          deleted_by UUID,
          version INTEGER DEFAULT 1 NOT NULL
        );
      `);
      
      // Create indexes
      await pool.query(`
        CREATE INDEX IF NOT EXISTS fabrics_sku_idx ON fabrics(sku);
        CREATE INDEX IF NOT EXISTS fabrics_slug_idx ON fabrics(slug);
        CREATE INDEX IF NOT EXISTS fabrics_name_idx ON fabrics(name);
        CREATE INDEX IF NOT EXISTS fabrics_type_idx ON fabrics(type);
        CREATE INDEX IF NOT EXISTS fabrics_status_idx ON fabrics(status);
        CREATE INDEX IF NOT EXISTS fabrics_brand_idx ON fabrics(brand);
        CREATE INDEX IF NOT EXISTS fabrics_collection_idx ON fabrics(collection);
        CREATE INDEX IF NOT EXISTS fabrics_created_at_idx ON fabrics(created_at);
        CREATE INDEX IF NOT EXISTS fabrics_deleted_at_idx ON fabrics(deleted_at);
      `);
      
      console.log('✅ Fabrics table created successfully');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDatabase();