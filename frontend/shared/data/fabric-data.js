"use strict";
// Fabric data for frontend experiences
// This is a shared resource for fabric-store and store-guide
Object.defineProperty(exports, "__esModule", { value: true });
exports.fabricSeedData = exports.fabricSwatches = exports.fabricCollections = void 0;
exports.getFeaturedFabrics = getFeaturedFabrics;
exports.getFabricCategories = getFabricCategories;
exports.getFabricById = getFabricById;
exports.filterFabrics = filterFabrics;
exports.fabricCollections = [
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
];
exports.fabricSwatches = [
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
];
// Helper functions for fabric data
function getFeaturedFabrics() {
    // Return the first 6 fabrics as featured
    return exports.fabricSwatches.slice(0, 6);
}
function getFabricCategories() {
    // Get unique categories from all fabrics
    const categories = new Set(exports.fabricSwatches.map(fabric => fabric.category));
    return Array.from(categories).map(category => ({
        id: category.toLowerCase(),
        name: category,
        count: exports.fabricSwatches.filter(f => f.category === category).length
    }));
}
function getFabricById(id) {
    return exports.fabricSwatches.find(fabric => fabric.id === id);
}
function filterFabrics(fabrics, filters) {
    return fabrics.filter(fabric => {
        if (filters.category && fabric.category !== filters.category)
            return false;
        if (filters.color && fabric.colorFamily !== filters.color)
            return false;
        if (filters.pattern && fabric.pattern !== filters.pattern)
            return false;
        if (filters.inStock !== undefined && fabric.inStock !== filters.inStock)
            return false;
        return true;
    });
}
// Export seed data alias for compatibility
exports.fabricSeedData = exports.fabricSwatches;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmFicmljLWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmYWJyaWMtZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdUNBQXVDO0FBQ3ZDLDZEQUE2RDs7O0FBb1I3RCxnREFHQztBQUVELGtEQVFDO0FBRUQsc0NBRUM7QUFFRCxzQ0FRQztBQWhSWSxRQUFBLGlCQUFpQixHQUF1QjtJQUNuRDtRQUNFLEVBQUUsRUFBRSxZQUFZO1FBQ2hCLElBQUksRUFBRSxzQkFBc0I7UUFDNUIsV0FBVyxFQUFFLHdDQUF3QztRQUNyRCxLQUFLLEVBQUUseUVBQXlFO0tBQ2pGO0lBQ0Q7UUFDRSxFQUFFLEVBQUUsUUFBUTtRQUNaLElBQUksRUFBRSxtQkFBbUI7UUFDekIsV0FBVyxFQUFFLDBDQUEwQztRQUN2RCxLQUFLLEVBQUUsc0VBQXNFO0tBQzlFO0lBQ0Q7UUFDRSxFQUFFLEVBQUUsU0FBUztRQUNiLElBQUksRUFBRSxvQkFBb0I7UUFDMUIsV0FBVyxFQUFFLDhDQUE4QztRQUMzRCxLQUFLLEVBQUUseUVBQXlFO0tBQ2pGO0lBQ0Q7UUFDRSxFQUFFLEVBQUUsVUFBVTtRQUNkLElBQUksRUFBRSxjQUFjO1FBQ3BCLFdBQVcsRUFBRSx1Q0FBdUM7UUFDcEQsS0FBSyxFQUFFLHlFQUF5RTtLQUNqRjtDQUNGLENBQUE7QUFFWSxRQUFBLGNBQWMsR0FBbUI7SUFDNUMsb0JBQW9CO0lBQ3BCO1FBQ0UsRUFBRSxFQUFFLFlBQVk7UUFDaEIsSUFBSSxFQUFFLHFCQUFxQjtRQUMzQixHQUFHLEVBQUUsUUFBUTtRQUNiLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLEtBQUssRUFBRSxNQUFNO1FBQ2IsV0FBVyxFQUFFLE1BQU07UUFDbkIsT0FBTyxFQUFFLE9BQU87UUFDaEIsS0FBSyxFQUFFLFFBQVE7UUFDZixVQUFVLEVBQUUsQ0FBQyxTQUFTLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixDQUFDO1FBQ3RELGNBQWMsRUFBRSxtRkFBbUY7UUFDbkcsUUFB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