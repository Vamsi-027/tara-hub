-- ============================================================================
-- MATERIALS MODULE - Simple Mirror of Admin Materials Table
-- ============================================================================

-- Materials table - exact same structure as admin
CREATE TABLE IF NOT EXISTS materials (
  id VARCHAR(255) PRIMARY KEY,  -- Same ID from admin
  name VARCHAR(255) NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Simple index for name lookups
CREATE INDEX idx_materials_name ON materials(name);