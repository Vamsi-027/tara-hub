import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function verifyProductCount({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT);
  
  try {
    console.log("\n=== VERIFYING PRODUCT COUNT ===\n");
    
    // Get all products without any filters
    const [allProducts, totalCount] = await productModuleService.listAndCountProducts({}, {
      relations: ["variants"],
      take: 100
    });
    
    console.log(`Total products via API: ${totalCount}`);
    console.log("\nProduct List:");
    console.log("ID | Handle | Title | Status | Created");
    console.log("-".repeat(80));
    
    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.id} | ${product.handle} | ${product.title} | ${product.status} | ${new Date(product.created_at).toISOString()}`);
    });
    
    // Check for any soft-deleted products
    console.log("\n=== CHECKING FOR SOFT-DELETED PRODUCTS ===");
    const deletedProducts = allProducts.filter(p => p.deleted_at);
    if (deletedProducts.length > 0) {
      console.log(`Found ${deletedProducts.length} soft-deleted products:`);
      deletedProducts.forEach(p => {
        console.log(`  - ${p.title} (deleted at: ${p.deleted_at})`);
      });
    } else {
      console.log("No soft-deleted products found.");
    }
    
    // Check for draft vs published
    const draftProducts = allProducts.filter(p => p.status === 'draft');
    const publishedProducts = allProducts.filter(p => p.status === 'published');
    
    console.log("\n=== PRODUCT STATUS BREAKDOWN ===");
    console.log(`Published: ${publishedProducts.length}`);
    console.log(`Draft: ${draftProducts.length}`);
    
    // Check variant count
    console.log("\n=== VARIANT COUNT ===");
    const [allVariants, variantCount] = await productModuleService.listAndCountProductVariants({}, {
      take: 200
    });
    console.log(`Total variants in database: ${variantCount}`);
    
    // Group variants by product
    const variantsByProduct = new Map();
    allVariants.forEach(v => {
      if (!variantsByProduct.has(v.product_id)) {
        variantsByProduct.set(v.product_id, []);
      }
      variantsByProduct.get(v.product_id).push(v);
    });
    
    console.log(`\nVariants grouped by ${variantsByProduct.size} products`);
    
    // Check for orphaned variants
    const productIds = new Set(allProducts.map(p => p.id));
    const orphanedVariants = allVariants.filter(v => !productIds.has(v.product_id));
    
    if (orphanedVariants.length > 0) {
      console.log(`\n⚠️  Found ${orphanedVariants.length} orphaned variants (no parent product):`);
      orphanedVariants.forEach(v => {
        console.log(`  - SKU: ${v.sku}, Product ID: ${v.product_id}`);
      });
    }
    
    console.log("\n=== SUMMARY ===");
    console.log(`You should see ${totalCount} rows in the product table.`);
    console.log(`If you're seeing 4 rows, one product may have been deleted directly from the database.`);
    
  } catch (error) {
    console.error("Error verifying product count:", error);
  }
}