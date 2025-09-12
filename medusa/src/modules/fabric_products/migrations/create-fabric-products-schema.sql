-- ============================================================================
-- FABRIC PRODUCTS SCHEMA (Configurable Products Only)
-- ============================================================================
-- Fixed fabric products use standard Medusa products + fabric-details module
-- This schema is only for products requiring user fabric selection
-- ============================================================================

-- Product type enum (only configurable types)
CREATE TYPE product_fabric_type AS ENUM (
  'configurable_fabric',      -- User selects single fabric during purchase
  'configurable_swatch_set'   -- User selects multiple fabrics (e.g., 5 for $10)
);

-- Configuration for products that require fabric selection
CREATE TABLE IF NOT EXISTS product_fabric_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(255) UNIQUE NOT NULL, -- Medusa product ID
  fabric_type product_fabric_type NOT NULL,
  
  -- Selection configuration
  allow_fabric_selection BOOLEAN DEFAULT true, -- Always true for configurable products
  fabric_category_filter VARCHAR(255),    -- Limit to specific category
  fabric_collection_filter VARCHAR(255),  -- Limit to specific collection
  max_fabric_selections INTEGER DEFAULT 1, -- 1 for configurable_fabric, N for swatch_set
  min_fabric_selections INTEGER DEFAULT 1,
  
  -- Pricing rules
  base_price_override DECIMAL(10,2),     -- Override product base price
  price_per_selection DECIMAL(10,2),     -- For swatch sets (e.g., $2 per swatch)
  
  -- Display configuration
  display_fabric_details BOOLEAN DEFAULT true,
  display_fabric_image BOOLEAN DEFAULT true,
  display_composition BOOLEAN DEFAULT true,
  display_specifications BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fabric selections for orders (stores customer's fabric choices)
CREATE TABLE IF NOT EXISTS order_fabric_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(255) NOT NULL,
  line_item_id VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  
  -- Selected fabric details (denormalized for history)
  fabric_id UUID NOT NULL,
  fabric_sku VARCHAR(255) NOT NULL,
  fabric_name VARCHAR(255) NOT NULL,
  fabric_price DECIMAL(10,2),
  fabric_metadata JSONB, -- Store snapshot of fabric details
  
  -- For swatch sets (track which selection this is)
  selection_index INTEGER DEFAULT 1, -- 1st, 2nd, 3rd selection etc.
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (fabric_id) REFERENCES fabrics(id) ON DELETE RESTRICT
);

-- Fabric availability and pricing per product
-- Controls which fabrics can be selected for a configurable product
CREATE TABLE IF NOT EXISTS fabric_product_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(255) NOT NULL,
  fabric_id UUID NOT NULL,
  
  is_available BOOLEAN DEFAULT true,
  price_adjustment DECIMAL(10,2) DEFAULT 0, -- Additional cost for this fabric
  lead_time_days INTEGER,                   -- Extra production time for this fabric
  min_order_quantity DECIMAL(10,2),         -- Minimum qty for this fabric
  
  UNIQUE(product_id, fabric_id),
  FOREIGN KEY (fabric_id) REFERENCES fabrics(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_product_fabric_config_type ON product_fabric_config(fabric_type);
CREATE INDEX idx_product_fabric_config_product ON product_fabric_config(product_id);
CREATE INDEX idx_order_fabric_selections_order ON order_fabric_selections(order_id);
CREATE INDEX idx_order_fabric_selections_line_item ON order_fabric_selections(line_item_id);
CREATE INDEX idx_fabric_availability_product ON fabric_product_availability(product_id);
CREATE INDEX idx_fabric_availability_fabric ON fabric_product_availability(fabric_id);