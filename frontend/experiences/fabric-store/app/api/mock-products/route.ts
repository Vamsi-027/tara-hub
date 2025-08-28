/**
 * Mock Products API
 * Temporary endpoint for testing while Medusa backend is being set up
 */

import { NextResponse } from 'next/server'

const mockProducts = [
  {
    id: 'prod_01',
    title: 'Premium Silk Fabric',
    handle: 'premium-silk-fabric',
    description: 'Luxurious silk fabric perfect for elegant dresses and scarves',
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800',
    images: [
      { id: '1', url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800' },
    ],
    collection: { id: 'col_01', title: 'Luxury Collection', handle: 'luxury' },
    categories: [{ id: 'cat_01', name: 'Silk', handle: 'silk' }],
    variants: [{
      id: 'var_01',
      title: 'Per Yard',
      sku: 'SILK-001',
      inventory_quantity: 50,
      prices: [{ id: '1', amount: 4500, currency_code: 'usd' }],
    }],
    metadata: {
      fabric_type: 'Silk',
      color: 'Ivory',
      pattern: 'Solid',
      width: 54,
      weight: 3.5,
      composition: ['100% Silk'],
      care_instructions: ['Dry clean only', 'Iron on low heat'],
      certifications: ['OEKO-TEX Standard 100'],
      sample_available: true,
      sample_price: 5,
      sample_size: '8x8 inches',
      performance_rating: { durability: 4, softness: 5, breathability: 5 }
    },
    tags: [{ id: '1', value: 'luxury' }, { id: '2', value: 'silk' }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod_02',
    title: 'Organic Cotton Canvas',
    handle: 'organic-cotton-canvas',
    description: 'Durable organic cotton canvas for bags and upholstery',
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800',
    images: [
      { id: '1', url: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800' },
    ],
    collection: { id: 'col_02', title: 'Eco-Friendly', handle: 'eco' },
    categories: [{ id: 'cat_02', name: 'Cotton', handle: 'cotton' }],
    variants: [{
      id: 'var_02',
      title: 'Per Yard',
      sku: 'COTTON-001',
      inventory_quantity: 100,
      prices: [{ id: '2', amount: 1800, currency_code: 'usd' }],
    }],
    metadata: {
      fabric_type: 'Cotton Canvas',
      color: 'Natural',
      pattern: 'Solid',
      width: 60,
      weight: 10,
      composition: ['100% Organic Cotton'],
      care_instructions: ['Machine wash cold', 'Tumble dry low'],
      certifications: ['GOTS Certified', 'OEKO-TEX'],
      sample_available: true,
      sample_price: 3,
      sample_size: '6x6 inches',
      performance_rating: { durability: 5, softness: 3, breathability: 4 }
    },
    tags: [{ id: '3', value: 'organic' }, { id: '4', value: 'cotton' }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod_03',
    title: 'Velvet Upholstery Fabric',
    handle: 'velvet-upholstery',
    description: 'Rich velvet fabric ideal for furniture upholstery',
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    images: [
      { id: '1', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800' },
    ],
    collection: { id: 'col_03', title: 'Upholstery', handle: 'upholstery' },
    categories: [{ id: 'cat_03', name: 'Velvet', handle: 'velvet' }],
    variants: [{
      id: 'var_03',
      title: 'Per Yard',
      sku: 'VELVET-001',
      inventory_quantity: 30,
      prices: [{ id: '3', amount: 3200, currency_code: 'usd' }],
    }],
    metadata: {
      fabric_type: 'Velvet',
      color: 'Emerald Green',
      pattern: 'Solid',
      width: 54,
      weight: 16,
      composition: ['82% Polyester', '18% Nylon'],
      care_instructions: ['Professional cleaning recommended'],
      certifications: ['Fire Retardant'],
      sample_available: true,
      sample_price: 8,
      sample_size: '10x10 inches',
      performance_rating: { durability: 4, softness: 5, breathability: 2 }
    },
    tags: [{ id: '5', value: 'upholstery' }, { id: '6', value: 'velvet' }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockCollections = [
  { id: 'col_01', title: 'Luxury Collection', handle: 'luxury' },
  { id: 'col_02', title: 'Eco-Friendly', handle: 'eco' },
  { id: 'col_03', title: 'Upholstery', handle: 'upholstery' },
]

const mockCategories = [
  { id: 'cat_01', name: 'Silk', handle: 'silk' },
  { id: 'cat_02', name: 'Cotton', handle: 'cotton' },
  { id: 'cat_03', name: 'Velvet', handle: 'velvet' },
  { id: 'cat_04', name: 'Linen', handle: 'linen' },
  { id: 'cat_05', name: 'Wool', handle: 'wool' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint') || 'products'

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  switch (endpoint) {
    case 'products':
      return NextResponse.json({
        products: mockProducts,
        count: mockProducts.length,
        offset: 0,
        limit: 20,
      }, { headers })

    case 'collections':
      return NextResponse.json({
        collections: mockCollections,
        count: mockCollections.length,
        offset: 0,
        limit: 20,
      }, { headers })

    case 'categories':
      return NextResponse.json({
        product_categories: mockCategories,
        count: mockCategories.length,
        offset: 0,
        limit: 20,
      }, { headers })

    default:
      return NextResponse.json({ error: 'Unknown endpoint' }, { status: 404, headers })
  }
}