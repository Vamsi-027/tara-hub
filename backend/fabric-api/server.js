const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
require('dotenv').config({ path: '../../.env.local' });

const app = express();
const PORT = process.env.FABRIC_API_PORT || 3010;

// Enable CORS for all origins (you can restrict this in production)
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  connectionString: process.env.POSTGRES_URL_NON_POOLING || 
                   process.env.DATABASE_URL || 
                   process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Fabric API is running' });
});

// Get all fabrics with optional filters
app.get('/api/fabrics', async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Parse query parameters
    const {
      limit = 50,
      offset = 0,
      page = 1, // Support page-based pagination
      search = '', // Add search parameter
      category,
      collection,
      color_family,
      pattern,
      in_stock
    } = req.query;
    
    // Calculate offset from page if provided
    const actualOffset = page > 1 ? (page - 1) * parseInt(limit) : parseInt(offset);
    
    // Build the query
    let query = `
      SELECT 
        id, name, sku, description, category, collection, 
        color_family, pattern, images, swatch_image, status,
        width, material, style, colors, brand,
        stock_unit, is_active
      FROM fabrics
      WHERE is_active = true
    `;
    
    const params = [];
    let paramCount = 1;
    
    // Add search filter if provided
    if (search && search.trim()) {
      query += ` AND (
        LOWER(name) LIKE LOWER($${paramCount}) OR 
        LOWER(sku) LIKE LOWER($${paramCount}) OR
        LOWER(description) LIKE LOWER($${paramCount}) OR
        LOWER(category) LIKE LOWER($${paramCount}) OR
        LOWER(collection) LIKE LOWER($${paramCount})
      )`;
      params.push(`%${search.trim()}%`);
      paramCount++;
    }
    
    // Add filters if provided
    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    if (collection) {
      query += ` AND collection = $${paramCount}`;
      params.push(collection);
      paramCount++;
    }
    
    if (color_family) {
      query += ` AND color_family = $${paramCount}`;
      params.push(color_family);
      paramCount++;
    }
    
    if (pattern) {
      query += ` AND pattern = $${paramCount}`;
      params.push(pattern);
      paramCount++;
    }
    
    // Skip in_stock filter as column doesn't exist
    
    // Add ordering and pagination
    query += ` ORDER BY id DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), actualOffset);
    
    // Execute the query
    const result = await client.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM fabrics 
      WHERE is_active = true
    `;
    
    const countParams = [];
    let countParamIndex = 1;
    
    // Add search to count query
    if (search && search.trim()) {
      countQuery += ` AND (
        LOWER(name) LIKE LOWER($${countParamIndex}) OR 
        LOWER(sku) LIKE LOWER($${countParamIndex}) OR
        LOWER(description) LIKE LOWER($${countParamIndex}) OR
        LOWER(category) LIKE LOWER($${countParamIndex}) OR
        LOWER(collection) LIKE LOWER($${countParamIndex})
      )`;
      countParams.push(`%${search.trim()}%`);
      countParamIndex++;
    }
    
    if (category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }
    
    if (collection) {
      countQuery += ` AND collection = $${countParamIndex}`;
      countParams.push(collection);
      countParamIndex++;
    }
    
    if (color_family) {
      countQuery += ` AND color_family = $${countParamIndex}`;
      countParams.push(color_family);
      countParamIndex++;
    }
    
    if (pattern) {
      countQuery += ` AND pattern = $${countParamIndex}`;
      countParams.push(pattern);
      countParamIndex++;
    }
    
    // Skip in_stock filter
    
    const countResult = await client.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);
    
    // Transform the data to match the expected format
    const fabrics = result.rows.map(fabric => ({
      ...fabric,
      // Map database fields to expected format
      swatch_image_url: fabric.swatch_image || fabric.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      color: fabric.colors?.[0] || fabric.color_family || 'Neutral',
      color_hex: '#3b82f6', // Default color hex
      properties: [], // No properties column in database
      composition: fabric.material || '',
      width: fabric.width || '54 inches',
      weight: 'Medium', // Default weight
      durability: 'Standard', // Default durability
      care_instructions: 'Professional cleaning recommended',
      usage: 'Indoor', // Default usage
      in_stock: fabric.is_active,
      price: 99.00 // Default price
    }));
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.json({
      fabrics,
      count: totalCount,
      totalCount: totalCount,
      page: parseInt(page) || Math.floor(actualOffset / parseInt(limit)) + 1,
      totalPages: totalPages,
      offset: actualOffset,
      limit: parseInt(limit)
    });
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch fabrics',
      message: error.message 
    });
  } finally {
    await client.end();
  }
});

// Get single fabric by ID
app.get('/api/fabrics/:id', async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(
      'SELECT * FROM fabrics WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fabric not found' });
    }
    
    const fabric = result.rows[0];
    
    // Enhanced fabric details mapping
    const enhancedFabric = {
      // Basic Information
      id: fabric.id,
      sku: fabric.sku,
      name: fabric.name,
      slug: fabric.slug,
      description: fabric.description || `Premium ${fabric.name} fabric from ${fabric.brand || 'our collection'}. Perfect for upholstery and interior design projects.`,
      brand: fabric.brand,
      collection: fabric.collection,
      category: fabric.category || fabric.types || 'Fabric',
      
      // Visual Information
      images: fabric.cdn_urls?.images || fabric.images || [],
      swatch_image_url: fabric.swatch_image_url || fabric.swatch_image || fabric.cdn_urls?.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
      lifestyle_image: fabric.lifestyle_image,
      
      // Color Information
      color: fabric.color || fabric.color_family || fabric.primary_color || 'Neutral',
      color_family: fabric.color_family || fabric.primary_color,
      color_hex: fabric.color_hex || '#94a3b8',
      primary_color: fabric.primary_color,
      secondary_colors: fabric.secondary_colors || [],
      colors: fabric.colors || [],
      
      // Material & Composition
      material: fabric.material || fabric.fiber_content,
      composition: fabric.composition || fabric.fiber_content || 'High-quality fabric blend',
      fiber_content: fabric.fiber_content,
      
      // Physical Properties
      width: fabric.width || '54 inches',
      weight: fabric.weight || 'Medium',
      pattern: fabric.pattern,
      style: fabric.style,
      h_repeat: fabric.h_repeat,
      v_repeat: fabric.v_repeat,
      
      // Performance & Durability
      durability: fabric.martindale ? `${fabric.martindale} Martindale cycles` : 'Standard durability',
      martindale: fabric.martindale,
      grade: fabric.grade,
      
      // Care & Maintenance
      care_instructions: fabric.care_instructions || fabric.cleaning || 'Professional cleaning recommended',
      cleaning_code: fabric.cleaning_code,
      cleaning_pdf: fabric.cleaning_pdf,
      washable: fabric.washable || false,
      bleach_cleanable: fabric.bleach_cleanable || false,
      
      // Resistance Properties
      stain_resistant: fabric.stain_resistant || false,
      fade_resistant: fabric.fade_resistant || false,
      
      // Compliance & Safety
      ca_117: fabric.ca_117 || false,
      
      // Usage & Application
      usage: fabric.usage || fabric.usage_suitability || 'Indoor',
      usage_suitability: fabric.usage_suitability,
      types: fabric.types,
      
      // Pricing & Stock
      price: fabric.yardage_price || fabric.price || 99.00,
      swatch_price: fabric.swatch_price,
      stock_unit: fabric.stock_unit || 'yards',
      in_stock: fabric.is_active && fabric.availability !== 'Out of Stock',
      availability: fabric.availability,
      low_stock_threshold: fabric.low_stock_threshold,
      quick_ship: fabric.quick_ship || false,
      closeout: fabric.closeout || false,
      
      // Additional Features
      properties: [
        ...(fabric.stain_resistant ? ['Stain Resistant'] : []),
        ...(fabric.fade_resistant ? ['Fade Resistant'] : []),
        ...(fabric.washable ? ['Machine Washable'] : []),
        ...(fabric.bleach_cleanable ? ['Bleach Cleanable'] : []),
        ...(fabric.ca_117 ? ['CA 117 Compliant'] : []),
        ...(fabric.quick_ship ? ['Quick Ship'] : [])
      ],
      additional_features: fabric.additional_features,
      
      // Business Information
      supplier_id: fabric.supplier_id,
      supplier_name: fabric.supplier_name,
      procurement_cost: fabric.procurement_cost,
      
      // Performance Metrics
      performance_metrics: fabric.performance_metrics,
      
      // Documentation
      technical_documents: fabric.technical_documents,
      cdn_urls: fabric.cdn_urls,
      
      // Metadata
      meta_title: fabric.meta_title,
      meta_description: fabric.meta_description,
      keywords: fabric.keywords,
      is_featured: fabric.is_featured || false,
      specifications: fabric.specifications || {},
      custom_fields: fabric.custom_fields || {},
      
      // Timestamps
      created_at: fabric.created_at,
      updated_at: fabric.updated_at,
      last_updated: fabric.last_updated,
      
      // Status
      status: fabric.status,
      is_active: fabric.is_active,
      version: fabric.version
    };

    res.json({
      fabric: enhancedFabric
    });
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch fabric',
      message: error.message 
    });
  } finally {
    await client.end();
  }
});

// Get fabric collections
app.get('/api/fabric-collections', async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT DISTINCT collection 
      FROM fabrics 
      WHERE collection IS NOT NULL 
      ORDER BY collection
    `);
    
    const collections = result.rows.map(row => ({
      id: row.collection.toLowerCase().replace(/\s+/g, '-'),
      name: row.collection,
      description: `Browse our ${row.collection} collection`,
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'
    }));
    
    res.json({ collections });
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch collections',
      message: error.message 
    });
  } finally {
    await client.end();
  }
});

// Get fabric categories
app.get('/api/fabric-categories', async (req, res) => {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT DISTINCT category 
      FROM fabrics 
      WHERE category IS NOT NULL 
      ORDER BY category
    `);
    
    const categories = result.rows.map(row => row.category);
    
    res.json({ categories });
    
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      message: error.message 
    });
  } finally {
    await client.end();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Fabric API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Fabrics endpoint: http://localhost:${PORT}/api/fabrics`);
});