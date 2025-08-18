-- ============================================
-- FABRICS TABLE MIGRATION
-- PostgreSQL migration script for creating fabric tables
-- Run this with: npm run db:migrate
-- ============================================

-- Create ENUMs
CREATE TYPE fabric_type AS ENUM (
  'Upholstery',
  'Drapery',
  'Multi-Purpose',
  'Outdoor',
  'Sheer',
  'Blackout'
);

CREATE TYPE fabric_status AS ENUM (
  'active',
  'inactive',
  'discontinued',
  'coming_soon',
  'out_of_stock'
);

CREATE TYPE durability_rating AS ENUM (
  'Light Duty',
  'Medium Duty',
  'Heavy Duty',
  'Extra Heavy Duty'
);

-- ============================================
-- Main fabrics table
-- ============================================
CREATE TABLE IF NOT EXISTS fabrics (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Basic information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type fabric_type NOT NULL,
  status fabric_status NOT NULL DEFAULT 'active',
  
  -- Visual properties
  pattern VARCHAR(100),
  primary_color VARCHAR(50),
  color_hex VARCHAR(7),
  color_family VARCHAR(50),
  secondary_colors JSONB,
  
  -- Manufacturer information
  manufacturer_id UUID,
  manufacturer_name VARCHAR(255) NOT NULL,
  collection VARCHAR(255),
  designer_name VARCHAR(255),
  country_of_origin VARCHAR(100),
  
  -- Pricing & Cost
  retail_price DECIMAL(10, 2) NOT NULL,
  wholesale_price DECIMAL(10, 2),
  cost_price DECIMAL(10, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  price_unit VARCHAR(20) NOT NULL DEFAULT 'per_yard',
  
  -- Physical properties
  width DECIMAL(6, 2) NOT NULL,
  width_unit VARCHAR(10) NOT NULL DEFAULT 'inches',
  weight DECIMAL(6, 2),
  weight_unit VARCHAR(10) DEFAULT 'oz/yd',
  thickness DECIMAL(4, 2),
  
  -- Composition
  fiber_content JSONB,
  backing_type VARCHAR(100),
  finish_treatment TEXT,
  
  -- Performance ratings
  durability_rating durability_rating,
  martindale INTEGER CHECK (martindale >= 0 AND martindale <= 100000),
  wyzenbeek INTEGER CHECK (wyzenbeek >= 0 AND wyzenbeek <= 100000),
  lightfastness INTEGER CHECK (lightfastness >= 1 AND lightfastness <= 8),
  pilling_resistance INTEGER CHECK (pilling_resistance >= 1 AND pilling_resistance <= 5),
  
  -- Treatment features
  is_stain_resistant BOOLEAN DEFAULT FALSE,
  is_fade_resistant BOOLEAN DEFAULT FALSE,
  is_water_resistant BOOLEAN DEFAULT FALSE,
  is_pet_friendly BOOLEAN DEFAULT FALSE,
  is_outdoor_safe BOOLEAN DEFAULT FALSE,
  is_fire_retardant BOOLEAN DEFAULT FALSE,
  is_bleach_cleanable BOOLEAN DEFAULT FALSE,
  is_antimicrobial BOOLEAN DEFAULT FALSE,
  
  -- Inventory management
  stock_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reserved_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  available_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  minimum_order DECIMAL(6, 2) NOT NULL DEFAULT 1,
  increment_quantity DECIMAL(6, 2) DEFAULT 1,
  
  -- Reorder management
  reorder_point DECIMAL(10, 2),
  reorder_quantity DECIMAL(10, 2),
  lead_time_days INTEGER,
  is_custom_order BOOLEAN DEFAULT FALSE,
  
  -- Location & Storage
  warehouse_location VARCHAR(50),
  bin_location VARCHAR(50),
  roll_count INTEGER DEFAULT 0,
  
  -- Care instructions
  care_instructions JSONB,
  cleaning_code VARCHAR(10),
  
  -- Media & Assets
  thumbnail_url TEXT,
  main_image_url TEXT,
  images JSONB,
  swatch_image_url TEXT,
  texture_image_url TEXT,
  
  -- Certifications & Compliance
  certifications JSONB,
  flammability_standard VARCHAR(100),
  environmental_rating VARCHAR(50),
  
  -- SEO & Marketing
  meta_title VARCHAR(255),
  meta_description TEXT,
  slug VARCHAR(255) UNIQUE,
  tags JSONB,
  search_keywords TEXT,
  
  -- Display & Features
  is_featured BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  -- Analytics & Tracking
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  sample_request_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  
  -- Notes & Internal
  internal_notes TEXT,
  public_notes TEXT,
  warranty_info TEXT,
  return_policy TEXT,
  
  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  deleted_at TIMESTAMP,
  deleted_by UUID
);

-- ============================================
-- Indexes for performance
-- ============================================

-- Unique constraints
CREATE UNIQUE INDEX idx_fabrics_sku ON fabrics(sku) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_fabrics_slug ON fabrics(slug) WHERE deleted_at IS NULL;

-- Single column indexes
CREATE INDEX idx_fabrics_name ON fabrics(name);
CREATE INDEX idx_fabrics_status ON fabrics(status);
CREATE INDEX idx_fabrics_type ON fabrics(type);
CREATE INDEX idx_fabrics_manufacturer ON fabrics(manufacturer_name);
CREATE INDEX idx_fabrics_collection ON fabrics(collection);
CREATE INDEX idx_fabrics_price ON fabrics(retail_price);
CREATE INDEX idx_fabrics_stock ON fabrics(available_quantity);
CREATE INDEX idx_fabrics_deleted_at ON fabrics(deleted_at);
CREATE INDEX idx_fabrics_created_at ON fabrics(created_at);
CREATE INDEX idx_fabrics_updated_at ON fabrics(updated_at);

-- Composite indexes
CREATE INDEX idx_fabrics_type_status ON fabrics(type, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_fabrics_manufacturer_collection ON fabrics(manufacturer_name, collection) WHERE deleted_at IS NULL;
CREATE INDEX idx_fabrics_status_stock ON fabrics(status, available_quantity) WHERE deleted_at IS NULL;
CREATE INDEX idx_fabrics_featured_order ON fabrics(is_featured, display_order) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX idx_fabrics_search ON fabrics 
USING gin(to_tsvector('english', 
  name || ' ' || 
  COALESCE(description, '') || ' ' || 
  COALESCE(pattern, '') || ' ' || 
  COALESCE(primary_color, '') || ' ' ||
  COALESCE(manufacturer_name, '') || ' ' ||
  COALESCE(collection, '') || ' ' ||
  COALESCE(search_keywords, '')
));

-- JSONB indexes for better query performance
CREATE INDEX idx_fabrics_tags ON fabrics USING gin(tags);
CREATE INDEX idx_fabrics_fiber_content ON fabrics USING gin(fiber_content);
CREATE INDEX idx_fabrics_images ON fabrics USING gin(images);

-- ============================================
-- Price history table
-- ============================================
CREATE TABLE IF NOT EXISTS fabric_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_id UUID NOT NULL REFERENCES fabrics(id) ON DELETE CASCADE,
  retail_price DECIMAL(10, 2) NOT NULL,
  wholesale_price DECIMAL(10, 2),
  effective_date TIMESTAMP NOT NULL,
  expiry_date TIMESTAMP,
  reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE INDEX idx_price_history_fabric ON fabric_price_history(fabric_id);
CREATE INDEX idx_price_history_date ON fabric_price_history(effective_date);

-- ============================================
-- Stock movements table
-- ============================================
CREATE TABLE IF NOT EXISTS fabric_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fabric_id UUID NOT NULL REFERENCES fabrics(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'reserved', 'released')),
  quantity DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  reference_type VARCHAR(50),
  reference_id TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID
);

CREATE INDEX idx_stock_movements_fabric ON fabric_stock_movements(fabric_id);
CREATE INDEX idx_stock_movements_date ON fabric_stock_movements(created_at);
CREATE INDEX idx_stock_movements_type ON fabric_stock_movements(movement_type);

-- ============================================
-- Triggers for automatic updates
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fabrics_updated_at BEFORE UPDATE ON fabrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update available quantity when stock or reserved quantity changes
CREATE OR REPLACE FUNCTION update_available_quantity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.available_quantity = NEW.stock_quantity - NEW.reserved_quantity;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fabrics_available_quantity 
  BEFORE INSERT OR UPDATE OF stock_quantity, reserved_quantity ON fabrics
  FOR EACH ROW EXECUTE FUNCTION update_available_quantity();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric_stock_movements ENABLE ROW LEVEL SECURITY;

-- Policies for fabrics table
-- Everyone can read active fabrics
CREATE POLICY "Public fabrics are viewable by everyone" ON fabrics
  FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

-- Only authenticated users can create
CREATE POLICY "Authenticated users can create fabrics" ON fabrics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update fabrics" ON fabrics
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Only admins can delete
CREATE POLICY "Only admins can delete fabrics" ON fabrics
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'tenant_admin', 'platform_admin')
    )
  );

-- ============================================
-- Functions for common operations
-- ============================================

-- Function to get low stock fabrics
CREATE OR REPLACE FUNCTION get_low_stock_fabrics(threshold DECIMAL DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  sku VARCHAR(50),
  name VARCHAR(255),
  available_quantity DECIMAL(10, 2),
  reorder_point DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.sku,
    f.name,
    f.available_quantity,
    f.reorder_point
  FROM fabrics f
  WHERE f.status = 'active' 
    AND f.deleted_at IS NULL
    AND (
      (threshold IS NOT NULL AND f.available_quantity <= threshold) OR
      (threshold IS NULL AND f.available_quantity <= f.reorder_point)
    )
  ORDER BY f.available_quantity ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to search fabrics
CREATE OR REPLACE FUNCTION search_fabrics(search_query TEXT)
RETURNS TABLE(
  id UUID,
  sku VARCHAR(50),
  name VARCHAR(255),
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.sku,
    f.name,
    ts_rank(
      to_tsvector('english', 
        f.name || ' ' || 
        COALESCE(f.description, '') || ' ' || 
        COALESCE(f.pattern, '') || ' ' || 
        COALESCE(f.primary_color, '') || ' ' ||
        COALESCE(f.manufacturer_name, '') || ' ' ||
        COALESCE(f.collection, '') || ' ' ||
        COALESCE(f.search_keywords, '')
      ),
      plainto_tsquery('english', search_query)
    ) as rank
  FROM fabrics f
  WHERE f.deleted_at IS NULL
    AND to_tsvector('english', 
      f.name || ' ' || 
      COALESCE(f.description, '') || ' ' || 
      COALESCE(f.pattern, '') || ' ' || 
      COALESCE(f.primary_color, '') || ' ' ||
      COALESCE(f.manufacturer_name, '') || ' ' ||
      COALESCE(f.collection, '') || ' ' ||
      COALESCE(f.search_keywords, '')
    ) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Sample data (optional)
-- ============================================

-- INSERT INTO fabrics (sku, name, type, status, manufacturer_name, retail_price, stock_quantity, width) VALUES
-- ('FAB-001', 'Luxury Velvet - Emerald', 'Upholstery', 'active', 'Premium Textiles Co', 89.99, 150, 54),
-- ('FAB-002', 'Linen Blend - Natural', 'Multi-Purpose', 'active', 'Natural Fibers Ltd', 45.99, 200, 54),
-- ('FAB-003', 'Outdoor Canvas - Navy', 'Outdoor', 'active', 'Weather Guard Fabrics', 35.99, 100, 60);

-- ============================================
-- Permissions
-- ============================================

-- Grant appropriate permissions
GRANT SELECT ON fabrics TO PUBLIC;
GRANT INSERT, UPDATE ON fabrics TO authenticated;
GRANT DELETE ON fabrics TO admin_role;
GRANT ALL ON fabric_price_history TO authenticated;
GRANT ALL ON fabric_stock_movements TO authenticated;
