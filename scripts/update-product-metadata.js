#!/usr/bin/env node

/**
 * Update Product Metadata in Medusa
 * This script helps set color and other metadata fields for products
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app';

// Product metadata to update
const PRODUCTS_METADATA = {
  'prod_01K5C2CN06C8E90SGS1NY77JQD': {
    // Sandwell Lipstick
    color: 'Red',
    color_family: 'Red',
    color_hex: '#DC143C',
    pattern: 'Solid',
    composition: '100% Premium Velvet',
    width: '54 inches',
    weight: 'Medium',
    durability: '50,000 double rubs',
    care_instructions: 'Professional cleaning recommended',
    usage: 'Indoor',
    style: 'Contemporary'
  },
  'prod_01K5C1WTEXSVAT5YXX2N9MZ6ZF': {
    // Covington Sandwell Putty
    color: 'Beige',
    color_family: 'Neutral',
    color_hex: '#F5DEB3',
    pattern: 'Textured',
    composition: '100% Polyester',
    width: '54 inches',
    weight: 'Medium',
    durability: '60,000 double rubs',
    care_instructions: 'Machine washable',
    usage: 'Indoor/Outdoor',
    style: 'Traditional'
  }
};

async function updateProductMetadata() {
  console.log('📝 Updating Product Metadata in Medusa');
  console.log('=====================================\n');

  console.log('⚠️  IMPORTANT: This requires admin access to Medusa');
  console.log('Please update metadata through Medusa Admin UI:\n');

  console.log('1. Login to Medusa Admin:');
  console.log('   https://medusa-backend-production-3655.up.railway.app/admin\n');

  console.log('2. For each product, go to Edit Product\n');

  console.log('3. In the "Metadata" section, add these fields:\n');

  for (const [productId, metadata] of Object.entries(PRODUCTS_METADATA)) {
    console.log(`\n📦 Product ID: ${productId}`);
    console.log('   Metadata fields to add:');
    console.log('   -------------------------');

    for (const [key, value] of Object.entries(metadata)) {
      console.log(`   ${key}: ${value}`);
    }
  }

  console.log('\n4. Save the changes\n');

  console.log('✅ Once saved, the fabric-store will show:');
  console.log('   - Correct colors and color swatches');
  console.log('   - Material composition');
  console.log('   - Care instructions');
  console.log('   - All other metadata fields\n');

  // Alternative: Use Medusa Admin API if you have the auth token
  console.log('💡 Alternative: Using Admin API (requires authentication):\n');
  console.log('If you have an admin API token, you can run:');
  console.log('```bash');
  console.log('curl -X POST \\');
  console.log(`  ${MEDUSA_BACKEND_URL}/admin/products/{product_id} \\`);
  console.log('  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"metadata": { "color": "Red", "color_hex": "#DC143C", ... }}\'');
  console.log('```\n');
}

// Helper function to display in table format
function displayMetadataTable() {
  console.log('\n📊 Metadata Fields Reference:');
  console.log('┌─────────────────────┬─────────────────────────┬──────────────────┐');
  console.log('│ Field               │ Example Value           │ Display Location │');
  console.log('├─────────────────────┼─────────────────────────┼──────────────────┤');
  console.log('│ color               │ Red                     │ Color swatch     │');
  console.log('│ color_family        │ Red                     │ Filter options   │');
  console.log('│ color_hex           │ #DC143C                 │ Color preview    │');
  console.log('│ pattern             │ Solid                   │ Product details  │');
  console.log('│ composition         │ 100% Premium Velvet     │ Material info    │');
  console.log('│ width               │ 54 inches               │ Specifications   │');
  console.log('│ weight              │ Medium                  │ Specifications   │');
  console.log('│ durability          │ 50,000 double rubs      │ Quality info     │');
  console.log('│ care_instructions   │ Professional cleaning   │ Care tab         │');
  console.log('│ usage               │ Indoor/Outdoor          │ Usage info       │');
  console.log('│ style               │ Contemporary            │ Style filters    │');
  console.log('└─────────────────────┴─────────────────────────┴──────────────────┘');
}

// Run the update
updateProductMetadata();
displayMetadataTable();

console.log('\n🎯 After updating metadata in Medusa Admin:');
console.log('   1. The fabric-store will automatically pick up the changes');
console.log('   2. No code changes or restart needed');
console.log('   3. Products will display with proper colors and details');