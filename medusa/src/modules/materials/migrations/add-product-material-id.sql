-- Add material_id column to product and FK to materials
-- Safe operations with IF NOT EXISTS guards

ALTER TABLE IF EXISTS product
  ADD COLUMN IF NOT EXISTS material_id VARCHAR(255) NULL;

-- Create index for faster lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_class c
    JOIN   pg_namespace n ON n.oid = c.relnamespace
    WHERE  c.relname = 'idx_product_material_id'
           AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_product_material_id ON public.product(material_id);
  END IF;
END$$;

-- Add FK constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints tc
    WHERE  tc.constraint_name = 'fk_product_material_id'
           AND tc.table_name = 'product'
  ) THEN
    ALTER TABLE public.product
      ADD CONSTRAINT fk_product_material_id
      FOREIGN KEY (material_id)
      REFERENCES public.materials(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END$$;

