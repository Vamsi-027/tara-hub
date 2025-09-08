const fs = require('fs').promises;
const path = require('path');

async function syncFabricData() {
  console.log('🔄 Syncing fabric data from admin app...');
  
  try {
    // Fetch data from admin API
    const response = await fetch('http://localhost:3000/api/v1/fabrics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const apiResponse = await response.json();
    const fabrics = apiResponse.data || [];
    console.log(`✅ Fetched ${fabrics.length} fabrics from admin API`);

    // Transform the data to match our interface
    const transformedFabrics = fabrics.map(fabric => ({
      id: fabric.sku || fabric.id, // Use SKU as primary ID (FAB-001, etc.)
      name: fabric.name || '',
      description: fabric.description || '',
      category: fabric.category || fabric.type || '',
      material: fabric.material || '',
      pattern: fabric.pattern || '',
      width: fabric.width ? `${fabric.width} inches` : '',
      manufacturer: fabric.brand || '',
      collection: fabric.collection || '',
      imageUrl: (fabric.images && fabric.images[0]) ? `http://localhost:3000${fabric.images[0]}` : '',
      colorFamily: fabric.colors || [],
      isPetFriendly: false, // These fields don't exist in admin data
      isStainResistant: false,
      isOutdoorSafe: fabric.type === 'Outdoor' || false,
      durabilityRating: fabric.weight ? Math.min(5, Math.floor(fabric.weight / 100)) : 0,
      careInstructions: '', // Not available in admin data
      status: fabric.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
      // Additional fields from admin
      sku: fabric.sku || '',
      type: fabric.type || '',
      brand: fabric.brand || '',
      style: fabric.style || '',
      weight: fabric.weight || null,
      colors: fabric.colors || [],
      retailPrice: fabric.retailPrice || null,
      stockQuantity: fabric.stockQuantity || 0,
      isFeatured: fabric.isFeatured || false,
      slug: fabric.slug || '',
    }));

    // Generate TypeScript file content
    const fileContent = `// This file is auto-generated from admin data
// Last synced: ${new Date().toISOString()}
// Run 'npm run sync-data' to refresh

import type { Fabric } from './api-client'

export const fabricSeedData: Fabric[] = ${JSON.stringify(transformedFabrics, null, 2)}

// Function to get fabric by ID from seed data
export function getFabricById(id: string): Fabric | undefined {
  return fabricSeedData.find(f => f.id === id)
}

// Export a function to filter fabrics
export function filterFabrics(filters: {
  category?: string
  search?: string
  isPetFriendly?: boolean
  isStainResistant?: boolean
  isOutdoorSafe?: boolean
}): Fabric[] {
  return fabricSeedData.filter(fabric => {
    if (filters.category && fabric.category !== filters.category) return false
    if (filters.isPetFriendly && !fabric.isPetFriendly) return false
    if (filters.isStainResistant && !fabric.isStainResistant) return false
    if (filters.isOutdoorSafe && !fabric.isOutdoorSafe) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        fabric.name.toLowerCase().includes(searchLower) ||
        fabric.description?.toLowerCase().includes(searchLower) ||
        fabric.category?.toLowerCase().includes(searchLower) ||
        fabric.material?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })
}

// Function to get featured fabrics
export function getFeaturedFabrics(limit = 6): Fabric[] {
  return fabricSeedData
    .filter(f => f.status === 'active')
    .sort((a, b) => (b.durabilityRating || 0) - (a.durabilityRating || 0))
    .slice(0, limit)
}

// Function to get fabric categories
export function getFabricCategories(): string[] {
  const categories = new Set(fabricSeedData.map(f => f.category).filter(Boolean))
  return Array.from(categories).sort()
}
`;

    // Write to file
    const outputPath = path.join(__dirname, '../lib/fabric-seed-data.ts');
    await fs.writeFile(outputPath, fileContent, 'utf8');
    
    console.log(`✅ Seed data updated successfully at ${outputPath}`);
    console.log(`📊 Stats: ${transformedFabrics.length} fabrics synced`);
    
    // Log categories for reference
    const categories = new Set(transformedFabrics.map(f => f.category).filter(Boolean));
    console.log(`📁 Categories: ${Array.from(categories).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Failed to sync fabric data:', error.message);
    console.log('💡 Make sure the admin app is running on port 3000');
    process.exit(1);
  }
}

// Run the sync
syncFabricData();