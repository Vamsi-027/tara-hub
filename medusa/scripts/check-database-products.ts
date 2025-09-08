import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function checkDatabaseProducts({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT);
  
  try {
    console.log("\n=== MEDUSA PRODUCT DATABASE STRUCTURE ===\n");
    console.log("Products are stored in PostgreSQL in these tables:");
    console.log("------------------------------------------------");
    console.log("1. 'product' table - Main product data");
    console.log("2. 'product_variant' table - Variants (Swatch/Yard)");
    console.log("3. 'product_variant_price' table - Pricing");
    console.log("4. 'product_option' table - Options (Type)");
    console.log("5. 'product_option_value' table - Option values");
    console.log("6. 'product_image' table - Product images");
    console.log("7. 'inventory_item' & 'inventory_level' - Stock");
    
    // Get all products with their full data
    const [products, count] = await productModuleService.listAndCountProducts({}, {
      relations: ["variants", "options", "images", "categories", "collection"],
      take: 10
    });
    
    console.log(`\n=== CURRENT PRODUCTS IN DATABASE ===`);
    console.log(`Total products: ${count}\n`);
    
    for (const product of products) {
      console.log(`\nProduct: ${product.title}`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Handle: ${product.handle}`);
      console.log(`  Status: ${product.status}`);
      console.log(`  Created: ${product.created_at}`);
      
      if (product.metadata && Object.keys(product.metadata).length > 0) {
        console.log(`  Metadata (Fabric Properties):`);
        const metadata = product.metadata as any;
        if (metadata.brand) console.log(`    - Brand: ${metadata.brand}`);
        if (metadata.color) console.log(`    - Color: ${metadata.color}`);
        if (metadata.pattern) console.log(`    - Pattern: ${metadata.pattern}`);
        if (metadata.composition) console.log(`    - Composition: ${metadata.composition}`);
        if (metadata.width) console.log(`    - Width: ${metadata.width}`);
        if (metadata.category) console.log(`    - Category: ${metadata.category}`);
      }
      
      if (product.variants && product.variants.length > 0) {
        console.log(`  Variants:`);
        for (const variant of product.variants) {
          console.log(`    - ${variant.title}: SKU ${variant.sku}`);
        }
      }
    }
    
    console.log("\n=== DATABASE CONNECTION INFO ===");
    console.log("Database: PostgreSQL (Neon Cloud)");
    console.log("Connection configured in: medusa/.env");
    console.log("Environment variable: DATABASE_URL");
    
  } catch (error) {
    console.error("Error checking database products:", error);
  }
}