-- Initial database setup for Tara Hub
-- This script runs when PostgreSQL container is first created

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create indexes for better performance
-- These will be created after Medusa migrations run
-- Uncomment after initial setup:
-- CREATE INDEX IF NOT EXISTS idx_raw_materials_name ON raw_materials USING gin (name gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);
-- CREATE INDEX IF NOT EXISTS idx_fabric_compositions_fabric_id ON fabric_compositions(fabric_id);
-- CREATE INDEX IF NOT EXISTS idx_fabric_compositions_material_id ON fabric_compositions(raw_material_id);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE medusa TO medusa;