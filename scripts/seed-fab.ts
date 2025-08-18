/**
 * Seed fabrics data into PostgreSQL
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sampleFabrics = [
  {
    sku: 'FAB-001',
    name: 'Premium Velvet - Emerald Green',
    slug: 'premium-velvet-emerald-green',
    description: 'Luxurious velvet fabric with deep emerald color and exceptional durability',
    type: 'Upholstery',
    brand: 'Luxury Textiles',
    collection: 'Royal Collection',
    category: 'Premium',
    style: 'Traditional',
    material: '100% Polyester Velvet',
    width: 54,
    weight: 450,
    pattern: 'Solid',
    colors: JSON.stringify(['Emerald Green']),
    color_family: 'Green',
    retail_price: 89.99,
    wholesale_price: 65.00,
    sale_price: null,
    cost: 45.00,
    stock_quantity: 150,
    stock_unit: 'yards',
    low_stock_threshold: 20,
    status: 'Active',
    is_active: true,
    is_featured: true,
  },
  {
    sku: 'FAB-002',
    name: 'Outdoor Canvas - Sand Beige',
    slug: 'outdoor-canvas-sand-beige',
    description: 'Weather-resistant canvas perfect for outdoor furniture and awnings',
    type: 'Outdoor',
    brand: 'WeatherGuard',
    collection: 'Outdoor Living',
    category: 'Outdoor',
    style: 'Contemporary',
    material: 'Solution-Dyed Acrylic',
    width: 60,
    weight: 320,
    pattern: 'Textured',
    colors: JSON.stringify(['Sand', 'Beige']),
    color_family: 'Neutral',
    retail_price: 45.99,
    wholesale_price: 32.00,
    sale_price: 39.99,
    cost: 22.00,
    stock_quantity: 280,
    stock_unit: 'yards',
    low_stock_threshold: 30,
    status: 'Sale',
    is_active: true,
    is_featured: false,
  },
  {
    sku: 'FAB-003',
    name: 'Sheer Elegance - White Voile',
    slug: 'sheer-elegance-white-voile',
    description: 'Delicate sheer fabric for elegant window treatments',
    type: 'Sheer',
    brand: 'Window Dreams',
    collection: 'Light & Airy',
    category: 'Window',
    style: 'Modern',
    material: '100% Polyester Voile',
    width: 118,
    weight: 85,
    pattern: 'Solid',
    colors: JSON.stringify(['White', 'Off-White']),
    color_family: 'White',
    retail_price: 12.99,
    wholesale_price: 8.50,
    sale_price: null,
    cost: 5.00,
    stock_quantity: 0,
    stock_unit: 'yards',
    low_stock_threshold: 50,
    status: 'Out of Stock',
    is_active: true,
    is_featured: false,
  },
  {
    sku: 'FAB-004',
    name: 'Genuine Leather - Cognac Brown',
    slug: 'genuine-leather-cognac-brown',
    description: 'Top-grain leather with rich cognac finish for luxury upholstery',
    type: 'Leather',
    brand: 'Heritage Leather',
    collection: 'Signature Series',
    category: 'Luxury',
    style: 'Classic',
    material: 'Top Grain Leather',
    width: 54,
    weight: 1200,
    pattern: 'Natural Grain',
    colors: JSON.stringify(['Cognac', 'Brown']),
    color_family: 'Brown',
    retail_price: 189.99,
    wholesale_price: 145.00,
    sale_price: null,
    cost: 95.00,
    stock_quantity: 45,
    stock_unit: 'hides',
    low_stock_threshold: 10,
    status: 'Active',
    is_active: true,
    is_featured: true,
  },
  {
    sku: 'FAB-005',
    name: 'Blackout Lining - Charcoal',
    slug: 'blackout-lining-charcoal',
    description: 'Premium blackout lining for complete light control',
    type: 'Blackout',
    brand: 'SleepWell',
    collection: 'Blackout Pro',
    category: 'Lining',
    style: 'Functional',
    material: '3-Pass Blackout Coating',
    width: 54,
    weight: 280,
    pattern: 'Solid',
    colors: JSON.stringify(['Charcoal']),
    color_family: 'Gray',
    retail_price: 24.99,
    wholesale_price: 18.00,
    sale_price: null,
    cost: 12.00,
    stock_quantity: 8,
    stock_unit: 'yards',
    low_stock_threshold: 15,
    status: 'Active',
    is_active: true,
    is_featured: false,
  }
];

async function seedFabrics() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found');
    process.exit(1);
  }

  console.log('🌱 Starting fabric seeding...');
  
  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL !== 'false' ? {
      rejectUnauthorized: false
    } : undefined,
  });

  try {
    // Check if fabrics already exist
    const existing = await pool.query('SELECT COUNT(*) FROM fabrics');
    if (existing.rows[0].count > 0) {
      console.log(`ℹ️ Fabrics table already contains ${existing.rows[0].count} items`);
      const response = await pool.query('SELECT id, sku, name FROM fabrics LIMIT 5');
      console.log('📋 Sample fabrics:');
      response.rows.forEach(row => {
        console.log(`  - ${row.sku}: ${row.name}`);
      });
      return;
    }

    // Insert sample fabrics
    for (const fabric of sampleFabrics) {
      const query = `
        INSERT INTO fabrics (
          sku, name, slug, description, type, brand, collection, 
          category, style, material, width, weight, pattern,
          colors, color_family, retail_price, wholesale_price, 
          sale_price, cost, stock_quantity, stock_unit,
          low_stock_threshold, status, is_active, is_featured
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
        )
      `;
      
      const values = [
        fabric.sku, fabric.name, fabric.slug, fabric.description,
        fabric.type, fabric.brand, fabric.collection, fabric.category,
        fabric.style, fabric.material, fabric.width, fabric.weight,
        fabric.pattern, fabric.colors, fabric.color_family,
        fabric.retail_price, fabric.wholesale_price, fabric.sale_price,
        fabric.cost, fabric.stock_quantity, fabric.stock_unit,
        fabric.low_stock_threshold, fabric.status, fabric.is_active,
        fabric.is_featured
      ];
      
      await pool.query(query, values);
      console.log(`✅ Added: ${fabric.name}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${sampleFabrics.length} fabrics`);
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedFabrics();