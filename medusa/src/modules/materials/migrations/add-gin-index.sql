-- Add GIN index for fast JSON queries on materials table
-- For 1000 records, this single index is sufficient

CREATE INDEX IF NOT EXISTS idx_materials_properties 
ON materials USING GIN (properties);