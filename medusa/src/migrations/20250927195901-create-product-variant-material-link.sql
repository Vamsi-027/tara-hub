CREATE TABLE IF NOT EXISTS product_variant_material_link (
  id                  TEXT PRIMARY KEY DEFAULT concat('pvmat_', md5(random()::text)),
  product_variant_id  VARCHAR(255) NOT NULL,
  material_id         VARCHAR(255) NOT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at          TIMESTAMP NULL,
  CONSTRAINT fk_pvml_variant FOREIGN KEY (product_variant_id)
    REFERENCES public.product_variant(id) ON DELETE CASCADE,
  CONSTRAINT fk_pvml_material FOREIGN KEY (material_id)
    REFERENCES public.materials(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_pvml_material_id ON product_variant_material_link (material_id);
CREATE INDEX IF NOT EXISTS idx_pvml_deleted_at ON product_variant_material_link (deleted_at) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_pvml_variant_material_active
  ON product_variant_material_link (product_variant_id, material_id)
  WHERE deleted_at IS NULL;
