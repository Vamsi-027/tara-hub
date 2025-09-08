/**
 * DATABASE SEED SCRIPT
 * Populates the database with sample fabric data
 * Run with: npm run db:seed or tsx scripts/seed-fabrics.ts
 */

import { db } from '../lib/db/client';
import { fabrics } from '../lib/db/schema/fabrics.schema';

// Sample fabric data
const sampleFabrics = [
  {
    sku: 'VEL-001',
    name: 'Luxury Velvet - Emerald Green',
    description: 'Premium Italian velvet with exceptional durability and lustrous finish',
    type: 'Upholstery' as const,
    status: 'active' as const,
    pattern: 'Solid',
    primaryColor: 'Emerald Green',
    colorHex: '#50C878',
    colorFamily: 'Green',
    manufacturerName: 'Italian Textiles Co.',
    collection: 'Luxury Collection 2024',
    retailPrice: '89.99',
    wholesalePrice: '54.99',
    costPrice: '35.00',
    width: '54',
    weight: '16',
    fiberContent: [
      { fiber: 'Cotton', percentage: 60 },
      { fiber: 'Polyester', percentage: 40 }
    ],
    durabilityRating: 'Heavy Duty' as const,
    martindale: 40000,
    wyzenbeek: 50000,
    lightfastness: 6,
    pillingResistance: 4,
    isStainResistant: true,
    isFadeResistant: true,
    isPetFriendly: true,
    stockQuantity: '150',
    availableQuantity: '150',
    minimumOrder: '2',
    reorderPoint: '20',
    reorderQuantity: '100',
    leadTimeDays: 14,
    warehouseLocation: 'A1-B2',
    binLocation: 'R12-S3',
    careInstructions: ['Professional cleaning recommended', 'Avoid direct sunlight'],
    cleaningCode: 'S',
    tags: ['luxury', 'velvet', 'green', 'italian'],
    isFeatured: true,
    slug: 'luxury-velvet-emerald-green',
  },
  {
    sku: 'LIN-002',
    name: 'Natural Linen Blend - Ivory',
    description: 'Breathable linen blend perfect for drapery and light upholstery',
    type: 'Multi-Purpose' as const,
    status: 'active' as const,
    pattern: 'Textured',
    primaryColor: 'Ivory',
    colorHex: '#FFFFF0',
    colorFamily: 'White',
    manufacturerName: 'Natural Fibers Ltd.',
    collection: 'Eco-Friendly Line',
    retailPrice: '45.99',
    wholesalePrice: '28.99',
    costPrice: '18.00',
    width: '54',
    weight: '8',
    fiberContent: [
      { fiber: 'Linen', percentage: 70 },
      { fiber: 'Cotton', percentage: 30 }
    ],
    durabilityRating: 'Medium Duty' as const,
    martindale: 25000,
    lightfastness: 5,
    pillingResistance: 3,
    isStainResistant: false,
    isFadeResistant: true,
    stockQuantity: '200',
    availableQuantity: '200',
    minimumOrder: '3',
    reorderPoint: '30',
    reorderQuantity: '150',
    leadTimeDays: 21,
    warehouseLocation: 'B2-C3',
    binLocation: 'R08-S2',
    careInstructions: ['Machine washable cold', 'Tumble dry low', 'Iron on medium'],
    cleaningCode: 'W',
    tags: ['linen', 'natural', 'eco-friendly', 'ivory'],
    isNewArrival: true,
    slug: 'natural-linen-blend-ivory',
  },
  {
    sku: 'OUT-003',
    name: 'Outdoor Canvas - Navy Blue',
    description: 'Weather-resistant canvas ideal for outdoor furniture and awnings',
    type: 'Outdoor' as const,
    status: 'active' as const,
    pattern: 'Solid',
    primaryColor: 'Navy Blue',
    colorHex: '#000080',
    colorFamily: 'Blue',
    manufacturerName: 'WeatherGuard Fabrics',
    collection: 'All-Weather Series',
    retailPrice: '35.99',
    wholesalePrice: '22.99',
    costPrice: '15.00',
    width: '60',
    weight: '12',
    fiberContent: [
      { fiber: 'Acrylic', percentage: 100 }
    ],
    durabilityRating: 'Extra Heavy Duty' as const,
    martindale: 50000,
    lightfastness: 8,
    pillingResistance: 5,
    isStainResistant: true,
    isFadeResistant: true,
    isWaterResistant: true,
    isOutdoorSafe: true,
    stockQuantity: '100',
    availableQuantity: '100',
    minimumOrder: '5',
    reorderPoint: '25',
    reorderQuantity: '100',
    leadTimeDays: 10,
    warehouseLocation: 'C3-D4',
    binLocation: 'R15-S5',
    careInstructions: ['Hose clean', 'Air dry', 'Do not dry clean'],
    cleaningCode: 'W',
    tags: ['outdoor', 'canvas', 'navy', 'waterproof'],
    isBestSeller: true,
    slug: 'outdoor-canvas-navy-blue',
  },
  {
    sku: 'PAT-004',
    name: 'Geometric Pattern - Black & Gold',
    description: 'Modern geometric design with metallic gold accents on black background',
    type: 'Upholstery' as const,
    status: 'active' as const,
    pattern: 'Geometric',
    primaryColor: 'Black',
    colorHex: '#000000',
    colorFamily: 'Black',
    secondaryColors: ['Gold'],
    manufacturerName: 'Modern Designs Inc.',
    collection: 'Contemporary Patterns',
    retailPrice: '125.99',
    wholesalePrice: '75.99',
    costPrice: '50.00',
    width: '54',
    weight: '14',
    fiberContent: [
      { fiber: 'Polyester', percentage: 80 },
      { fiber: 'Metallic', percentage: 20 }
    ],
    durabilityRating: 'Heavy Duty' as const,
    martindale: 35000,
    lightfastness: 5,
    pillingResistance: 4,
    isStainResistant: true,
    stockQuantity: '75',
    availableQuantity: '75',
    minimumOrder: '2',
    reorderPoint: '15',
    reorderQuantity: '50',
    leadTimeDays: 28,
    warehouseLocation: 'D4-E5',
    binLocation: 'R20-S8',
    careInstructions: ['Professional cleaning only', 'Avoid moisture'],
    cleaningCode: 'S',
    tags: ['geometric', 'pattern', 'black', 'gold', 'luxury', 'modern'],
    isFeatured: true,
    isNewArrival: true,
    slug: 'geometric-pattern-black-gold',
  },
  {
    sku: 'SHR-005',
    name: 'Sheer Voile - White',
    description: 'Delicate sheer fabric perfect for window treatments and layering',
    type: 'Sheer' as const,
    status: 'active' as const,
    pattern: 'Solid',
    primaryColor: 'White',
    colorHex: '#FFFFFF',
    colorFamily: 'White',
    manufacturerName: 'Light & Airy Textiles',
    collection: 'Window Essentials',
    retailPrice: '18.99',
    wholesalePrice: '11.99',
    costPrice: '7.00',
    width: '118',
    weight: '3',
    fiberContent: [
      { fiber: 'Polyester', percentage: 100 }
    ],
    durabilityRating: 'Light Duty' as const,
    lightfastness: 4,
    pillingResistance: 2,
    stockQuantity: '300',
    availableQuantity: '300',
    minimumOrder: '10',
    reorderPoint: '50',
    reorderQuantity: '200',
    leadTimeDays: 7,
    warehouseLocation: 'E5-F6',
    binLocation: 'R05-S1',
    careInstructions: ['Machine washable', 'Gentle cycle', 'Hang to dry'],
    cleaningCode: 'W',
    tags: ['sheer', 'voile', 'white', 'window', 'curtain'],
    slug: 'sheer-voile-white',
  },
];

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Test database connection
    const testConnection = await db.execute(sql`SELECT 1`);
    console.log('✅ Database connected');
    
    // Clear existing data (optional - comment out in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🗑️ Clearing existing fabrics...');
      await db.delete(fabrics);
    }
    
    // Insert sample fabrics
    console.log('📦 Inserting sample fabrics...');
    
    for (const fabric of sampleFabrics) {
      const result = await db.insert(fabrics).values({
        ...fabric,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }).returning();
      
      console.log(`  ✅ Created: ${result[0].name} (${result[0].sku})`);
    }
    
    // Verify insertion
    const count = await db.select({ count: sql`count(*)` }).from(fabrics);
    console.log(`\n✨ Seed complete! ${count[0].count} fabrics in database.`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await dbClient.disconnect();
    process.exit(0);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed();
}

export { seed };
