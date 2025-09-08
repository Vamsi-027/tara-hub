import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function cleanupTestProducts({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT);
  
  try {
    // Find all products with "test" in their handle or title
    const [products] = await productModuleService.listAndCountProducts({
      $or: [
        { handle: { $ilike: "%test%" } },
        { title: { $ilike: "%test%" } }
      ]
    }, {
      relations: ["variants"]
    });
    
    console.log(`\nFound ${products.length} test products to clean up:\n`);
    
    for (const product of products) {
      console.log(`- ${product.title} (${product.handle})`);
      console.log(`  Variants: ${product.variants?.map(v => v.sku).join(', ')}`);
    }
    
    if (products.length > 0) {
      console.log("\nDeleting test products...");
      
      // Delete products
      const productIds = products.map(p => p.id);
      await productModuleService.deleteProducts(productIds);
      
      console.log("✅ Test products deleted successfully!");
    } else {
      console.log("No test products found to clean up.");
    }
    
  } catch (error) {
    console.error("Error cleaning up test products:", error);
  }
}