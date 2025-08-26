// Fabric data for frontend experiences
// This is a shared resource for fabric-store and store-guide

export interface SwatchCollection {
  id: string
  name: string
  description: string
  image: string
}

export interface SwatchFabric {
  id: string
  name: string
  sku: string
  category: string
  color: string
  colorFamily: string
  pattern: string
  usage: 'Indoor' | 'Outdoor' | 'Both'
  properties: string[]
  swatchImageUrl: string
  colorHex: string
  description: string
  composition: string
  width: string
  weight: string
  durability: string
  careInstructions: string
  inStock: boolean
  collection?: string
}

export const fabricCollections: SwatchCollection[] = [
  {
    id: 'essentials',
    name: 'Essential Collection',
    description: 'Timeless fabrics for everyday elegance',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80'
  },
  {
    id: 'luxury',
    name: 'Luxury Collection',
    description: 'Premium fabrics for sophisticated spaces',
    image: 'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=400&q=80'
  },
  {
    id: 'outdoor',
    name: 'Outdoor Collection',
    description: 'Weather-resistant fabrics for outdoor living',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80'
  },
  {
    id: 'trending',
    name: 'Trending Now',
    description: 'The latest in fabric design and color',
    image: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=400&q=80'
  }
]

export const fabricSwatches: SwatchFabric[] = [
  // Cotton Collection
  {
    id: 'cotton-001',
    name: 'Classic Navy Canvas',
    sku: 'CN-001',
    category: 'Cotton',
    color: 'Navy',
    colorFamily: 'Blue',
    pattern: 'Solid',
    usage: 'Indoor',
    properties: ['Durable', 'Easy Care', 'Fade Resistant'],
    swatchImageUrl: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=300&h=300&fit=crop',
    colorHex: '#1e3a8a',
    description: 'A versatile navy cotton canvas perfect for upholstery and home decor',
    composition: '100% Cotton Canvas',
    width: '54"',
    weight: '12 oz',
    durability: 'Heavy Duty',
    careInstructions: 'Machine washable, cold water',
    inStock: true,
    collection: 'essentials'
  },
  {
    id: 'cotton-002',
    name: 'Soft Sage Linen Blend',
    sku: 'SL-002',
    category: 'Cotton',
    color: 'Sage',
    colorFamily: 'Green',
    pattern: 'Solid',
    usage: 'Indoor',
    properties: ['Breathable', 'Natural', 'Pre-shrunk'],
    swatchImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
    colorHex: '#86a873',
    description: 'A calming sage green linen-cotton blend with natural texture',
    composition: '70% Cotton, 30% Linen',
    width: '52"',
    weight: '9 oz',
    durability: 'Medium',
    careInstructions: 'Machine wash gentle, line dry',
    inStock: true,
    collection: 'essentials'
  },
  {
    id: 'cotton-003',
    name: 'Cream Herringbone',
    sku: 'CH-003',
    category: 'Cotton',
    color: 'Cream',
    colorFamily: 'Neutral',
    pattern: 'Herringbone',
    usage: 'Indoor',
    properties: ['Textured', 'Classic', 'Versatile'],
    swatchImageUrl: 'https://images.unsplash.com/photo-1564258523680-07f21750566f?w=300&h=300&fit=crop',
    colorHex: '#f5f5dc',
    description: 'Elegant cream herringbone pattern adds subtle texture',
    composition: '100% Cotton',
    width: '54"',
    weight: '10 oz',
    durability: 'Medium',
    careInstructions: 'Dry clean recommended',
    inStock: true,
    collection: 'essentials'
  },
  // Velvet Collection
  {
    id: 'velvet-001',
    name: 'Emerald Luxury Velvet',
    sku: 'EV-001',
    category: 'Velvet',
    color: 'Emerald',
    colorFamily: 'Green',
    pattern: 'Solid',
    usage: 'Indoor',
    properties: ['Luxurious', 'Rich Color', 'Stain Resistant'],
    swatchImageUrl: 'https://images.unsplash.com/photo-1604076984203-587c92ab2e58?w=300&h=300&fit=crop',
    colorHex: '#065f46',
    description: 'Deep emerald velvet with exceptional luster and depth',
    composition: '100% Polyester Velvet',
    width: '54"',
    weight: '16 oz',
    durability: 'Heavy Duty',
    careInstructions: 'Professional cleaning',
    inStock: true,
    collection: 'luxury'
  },
  {
    id: 'velvet-002',
    name: 'Blush Pink Velvet',
    sku: 'BV-002',
    category: 'Velvet',
    color: 'Blush',
    colorFamily: 'Pink',
    pattern: 'Solid',
    usage: 'Indoor',
    properties: ['Soft Touch', 'Elegant', 'Light Resistant'],
    swatchImageUrl: 'https://images.unsplash.com/photo-1593749019760-b0ba0896c967?w=300&h=300&fit=crop',
    colorHex: '#fbbcbc',
    description: 'Soft blush pink velvet perfect for feminine spaces',
    composition: '92% Polyester, 8% Cotton',
    width: '54"',
    weight: '14 oz',
    durability: 'Medium',
    careInstructions: 'Spot clean only',
    inStock: true,
    collection: 'luxury'
  },
  // Outdoor Collection
  {
    id: 'outdoor-001',
    name: 'Marina Blue Outdoor',
    sku: 'MO-001',
    category: 'Outdoor',
    color: 'Marina Blue',
    colorFamily: 'Blue',
    pattern: 'Solid',
    usage: 'Outdoor',
    properties: ['Weather Resistant', 'UV Protected', 'Mildew Resistant'],
    swatchImageUrl: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=300&h=300&fit=crop',
    colorHex: '#0077be',
    description: 'Durable outdoor fabric designed to withstand the elements',
    composition: '100% Solution-Dyed Acrylic',
    width: '54"',
    weight: '8 oz',
    durability: 'Heavy Duty',
    careInstructions: 'Hose off and air dry',
    inStock: true,
    collection: 'outdoor'
  },
  {
    id: 'outdoor-002',
    name: 'Charcoal Weave Outdoor',
    sku: 'CO-002',
    category: 'Outdoor',
    color: 'Charcoal',
    colorFamily: 'Gray',
    pattern: 'Textured',
    usage: 'Outdoor',
    properties: ['All-Weather', 'Quick Dry', 'Colorfast'],
    swatchImageUrl: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=300&h=300&fit=crop',
    colorHex: '#36454f',
    description: 'Sophisticated charcoal outdoor fabric with subtle texture',
    composition: '100% Olefin',
    width: '54"',
    weight: '9 oz',
    durability: 'Heavy Duty',
    careInstructions: 'Machine washable',
    inStock: true,
    collection: 'outdoor'
  },
  // Trending Collection
  {
    id: 'trending-001',
    name: 'Terracotta Geometric',
    sku: 'TG-001',
    category: 'Print',
    color: 'Terracotta',
    colorFamily: 'Orange',
    pattern: 'Geometric',
    usage: 'Indoor',
    properties: ['Modern', 'Bold Pattern', 'Fade Resistant'],
    swatchImageUrl: 'https://images.unsplash.com/photo-1617082133098-a58e883e1c72?w=300&h=300&fit=crop',
    colorHex: '#c65d00',
    description: 'Contemporary geometric pattern in warm terracotta tones',
    composition: '65% Polyester, 35% Cotton',
    width: '54"',
    weight: '11 oz',
    durability: 'Medium',
    careInstructions: 'Machine wash cold',
    inStock: true,
    collection: 'trending'
  },
  {
    id: 'trending-002',
    name: 'Botanical Print Natural',
    sku: 'BP-002',
    category: 'Print',
    color: 'Natural',
    colorFamily: 'Neutral',
    pattern: 'Botanical',
    usage: 'Indoor',
    properties: ['Nature-Inspired', 'Artistic', 'Light Weight'],
    swatchImageUrl: 'https://images.unsplash.com/photo-1604709177595-ee9c2580e9a3?w=300&h=300&fit=crop',
    colorHex: '#f0e6d2',
    description: 'Delicate botanical print on natural linen background',
    composition: '100% Linen',
    width: '52"',
    weight: '7 oz',
    durability: 'Light',
    careInstructions: 'Dry clean or gentle wash',
    inStock: true,
    collection: 'trending'
  },
  {
    id: 'trending-003',
    name: 'Bold Stripe Navy/White',
    sku: 'BS-003',
    category: 'Print',
    color: 'Navy/White',
    colorFamily: 'Blue',
    pattern: 'Stripe',
    usage: 'Both',
    properties: ['Classic', 'Nautical', 'Versatile'],
    swatchImageUrl: 'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=300&h=300&fit=crop',
    colorHex: '#1e3a8a',
    description: 'Classic navy and white stripe perfect for coastal themes',
    composition: '100% Acrylic',
    width: '54"',
    weight: '10 oz',
    durability: 'Heavy Duty',
    careInstructions: 'Machine washable',
    inStock: true,
    collection: 'trending'
  }
]

// Helper functions for fabric data
export function getFeaturedFabrics() {
  // Return the first 6 fabrics as featured
  return fabricSwatches.slice(0, 6);
}

export function getFabricCategories() {
  // Get unique categories from all fabrics
  const categories = new Set(fabricSwatches.map(fabric => fabric.category));
  return Array.from(categories).map(category => ({
    id: category.toLowerCase(),
    name: category,
    count: fabricSwatches.filter(f => f.category === category).length
  }));
}

export function getFabricById(id: string) {
  return fabricSwatches.find(fabric => fabric.id === id);
}

export function filterFabrics(fabrics: SwatchFabric[], filters: any) {
  return fabrics.filter(fabric => {
    if (filters.category && fabric.category !== filters.category) return false;
    if (filters.color && fabric.colorFamily !== filters.color) return false;
    if (filters.pattern && fabric.pattern !== filters.pattern) return false;
    if (filters.inStock !== undefined && fabric.inStock !== filters.inStock) return false;
    return true;
  });
}

// Export seed data alias for compatibility
export const fabricSeedData = fabricSwatches;