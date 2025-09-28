/**
 * Test Fixtures and Seeding Utilities
 *
 * Provides consistent test data factories that work with:
 * - Medusa v2 service layer
 * - MikroORM entities
 * - Raw PostgreSQL for performance
 * - Neon DB optimizations
 */

import { Pool } from "pg";
import { EntityManager } from "@mikro-orm/postgresql";
// Simplified test data generation without faker to avoid ESM issues
const generateTestData = {
  string: (length = 8) => Math.random().toString(36).slice(2, 2 + length),
  number: (min = 1, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min,
  arrayElement: <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)],
  productName: () => `Test Product ${generateTestData.string(6)}`,
  materialName: () => `Test Material ${generateTestData.string(6)}`,
  email: () => `test.${generateTestData.string(8)}@example.com`,
  firstName: () => generateTestData.arrayElement(['John', 'Jane', 'Alex', 'Sam', 'Chris']),
  lastName: () => generateTestData.arrayElement(['Smith', 'Johnson', 'Brown', 'Davis', 'Miller']),
  color: () => generateTestData.arrayElement(['Red', 'Blue', 'Green', 'Yellow', 'Purple']),
  materialType: () => generateTestData.arrayElement(['cotton', 'linen', 'wool', 'silk', 'synthetic']),
};

export interface MaterialFixture {
  id: string;
  name: string;
  code?: string;
  type?: string;
  properties?: Record<string, any>;
}

export interface ProductFixture {
  id: string;
  title: string;
  handle: string;
  description?: string;
  variants?: ProductVariantFixture[];
}

export interface ProductVariantFixture {
  id: string;
  title: string;
  sku: string;
  materialId?: string;
}

export interface CustomerFixture {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface OrderFixture {
  id: string;
  customerId: string;
  status: string;
  currency: string;
  total: number;
}

/**
 * Test data factories using consistent patterns
 */
export class TestDataFactory {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  createMaterial(overrides: Partial<MaterialFixture> = {}): MaterialFixture {
    const id = overrides.id || `${this.prefix}_mat_${generateTestData.string(8)}`;

    return {
      id,
      name: overrides.name || generateTestData.materialName(),
      code: overrides.code || generateTestData.string(10).toUpperCase(),
      type: overrides.type || generateTestData.materialType(),
      properties: {
        weight: generateTestData.number(100, 800),
        color: generateTestData.color(),
        pattern: generateTestData.arrayElement(['solid', 'striped', 'checked', 'floral']),
        origin: 'Test Country',
        ...overrides.properties,
      },
    };
  }

  createProduct(overrides: Partial<ProductFixture> = {}): ProductFixture {
    const id = overrides.id || `${this.prefix}_prod_${generateTestData.string(8)}`;
    const title = overrides.title || generateTestData.productName();

    return {
      id,
      title,
      handle: overrides.handle || `${this.prefix}_${title.toLowerCase().replace(/\s+/g, '-')}_${generateTestData.string(4)}`,
      description: overrides.description || `Test product description for ${title}`,
      variants: overrides.variants || [this.createProductVariant({ productId: id })],
    };
  }

  createProductVariant(overrides: Partial<ProductVariantFixture & { productId?: string }> = {}): ProductVariantFixture {
    const id = overrides.id || `${this.prefix}_var_${generateTestData.string(8)}`;

    return {
      id,
      title: overrides.title || `Test Variant ${generateTestData.string(4)}`,
      sku: overrides.sku || `${this.prefix}_SKU_${generateTestData.string(8)}`.toUpperCase(),
      materialId: overrides.materialId,
    };
  }

  createCustomer(overrides: Partial<CustomerFixture> = {}): CustomerFixture {
    const id = overrides.id || `${this.prefix}_cust_${generateTestData.string(8)}`;

    return {
      id,
      email: overrides.email || generateTestData.email(),
      firstName: overrides.firstName || generateTestData.firstName(),
      lastName: overrides.lastName || generateTestData.lastName(),
    };
  }

  createOrder(overrides: Partial<OrderFixture> = {}): OrderFixture {
    const id = overrides.id || `${this.prefix}_order_${generateTestData.string(8)}`;

    return {
      id,
      customerId: overrides.customerId || `${this.prefix}_cust_${generateTestData.string(8)}`,
      status: overrides.status || generateTestData.arrayElement(['pending', 'completed', 'cancelled']),
      currency: overrides.currency || 'usd',
      total: overrides.total || generateTestData.number(1000, 50000), // cents
    };
  }
}

/**
 * Database Seeder - Performance optimized for Neon
 */
export class DatabaseSeeder {
  constructor(private pool: Pool, private prefix: string) {}

  /**
   * Seed materials using batch insert for performance
   */
  async seedMaterials(materials: MaterialFixture[]): Promise<void> {
    if (materials.length === 0) return;

    const values = materials.map((m, index) =>
      `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
    ).join(', ');

    const params = materials.flatMap(m => [
      m.id,
      m.name,
      m.code,
      m.type,
      JSON.stringify(m.properties || {}),
    ]);

    const query = `
      INSERT INTO materials (id, name, code, type, properties, created_at, updated_at)
      VALUES ${values}
      ON CONFLICT (id) DO NOTHING
    `;

    await this.pool.query(query, params);
  }

  /**
   * Seed products with variants using transaction
   */
  async seedProducts(products: ProductFixture[]): Promise<void> {
    if (products.length === 0) return;

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Insert products
      for (const product of products) {
        await client.query(
          `INSERT INTO product (id, title, handle, description, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          [product.id, product.title, product.handle, product.description]
        );

        // Insert variants
        if (product.variants) {
          for (const variant of product.variants) {
            await client.query(
              `INSERT INTO product_variant (id, product_id, title, sku, created_at, updated_at)
               VALUES ($1, $2, $3, $4, NOW(), NOW())
               ON CONFLICT (id) DO NOTHING`,
              [variant.id, product.id, variant.title, variant.sku]
            );

            const materialIds = Array.isArray((variant as any).materialIds)
              ? Array.from(new Set((variant as any).materialIds as string[]))
              : variant.materialId
              ? [variant.materialId]
              : [];

            for (const materialId of materialIds) {
              await client.query(
                `INSERT INTO product_variant_material_link (product_variant_id, material_id, created_at, updated_at, deleted_at)
                 VALUES ($1, $2, NOW(), NOW(), NULL)`,
                [variant.id, materialId]
              );
            }
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Clean all test data using prefix
   */
  async cleanTestData(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Clean in dependency order
      const cleanupQueries = [
        `DELETE FROM product_variant_material_link WHERE product_variant_id LIKE '${this.prefix}%'`,
        `DELETE FROM product_variant WHERE id LIKE '${this.prefix}%'`,
        `DELETE FROM product WHERE id LIKE '${this.prefix}%'`,
        `DELETE FROM materials WHERE id LIKE '${this.prefix}%'`,
        `DELETE FROM order_line_item WHERE variant_id LIKE '${this.prefix}%'`,
        `DELETE FROM orders WHERE id LIKE '${this.prefix}%'`,
        `DELETE FROM customers WHERE id LIKE '${this.prefix}%'`,
      ];

      for (const query of cleanupQueries) {
        try {
          await client.query(query);
        } catch (error) {
          // Ignore table not found errors
          if (!error.message.includes('does not exist')) {
            console.warn(`Cleanup warning for query "${query}":`, error.message);
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

/**
 * ORM-based seeder for complex operations
 */
export class ORMSeeder {
  constructor(private em: EntityManager, private prefix: string) {}

  /**
   * Seed using MikroORM entities (for complex relationships)
   */
  async seedWithORM(data: any): Promise<void> {
    try {
      await this.em.begin();

      // Use EntityManager for complex operations
      // This is where you'd use actual Medusa entities
      // For now, we'll use raw queries through EM

      if (data.materials) {
        for (const material of data.materials) {
          await this.em.execute(
            `INSERT INTO materials (id, name, code, type, properties, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW(), NOW())
             ON CONFLICT (id) DO NOTHING`,
            [material.id, material.name, material.code, material.type, JSON.stringify(material.properties || {})]
          );
        }
      }

      await this.em.commit();
    } catch (error) {
      await this.em.rollback();
      throw error;
    }
  }
}

/**
 * Common test scenarios
 */
export const TEST_SCENARIOS = {
  /**
   * Basic materials testing scenario
   */
  basicMaterials: (prefix: string): MaterialFixture[] => {
    const factory = new TestDataFactory(prefix);
    return [
      factory.createMaterial({ name: 'Test Cotton', type: 'cotton' }),
      factory.createMaterial({ name: 'Test Linen', type: 'linen' }),
      factory.createMaterial({ name: 'Test Wool', type: 'wool' }),
    ];
  },

  /**
   * Product with material links scenario
   */
  productWithMaterials: (prefix: string): { products: ProductFixture[], materials: MaterialFixture[] } => {
    const factory = new TestDataFactory(prefix);

    const materials = [
      factory.createMaterial({ name: 'Premium Cotton', type: 'cotton' }),
      factory.createMaterial({ name: 'Luxury Silk', type: 'silk' }),
    ];

    const products = [
      factory.createProduct({
        title: 'Test Fabric Bundle',
        variants: [
          factory.createProductVariant({
            title: 'Cotton Variant',
            materialId: materials[0].id,
          }),
          factory.createProductVariant({
            title: 'Silk Variant',
            materialId: materials[1].id,
          }),
        ],
      }),
    ];

    return { products, materials };
  },

  /**
   * E-commerce testing scenario
   */
  ecommerceFlow: (prefix: string) => {
    const factory = new TestDataFactory(prefix);

    const materials = TEST_SCENARIOS.basicMaterials(prefix);
    const customer = factory.createCustomer();
    const { products } = TEST_SCENARIOS.productWithMaterials(prefix);
    const order = factory.createOrder({ customerId: customer.id });

    return { materials, products, customer, order };
  },
};
