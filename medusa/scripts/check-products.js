const { ModuleRegistrationName } = require("@medusajs/framework/utils");

module.exports = async function checkProducts({ container }) {
  const productModuleService = container.resolve(ModuleRegistrationName.PRODUCT);
  
  try {
    // Check existing products
    const [products, count] = await productModuleService.listAndCountProducts({}, {
      relations: ["variants", "options"],
      take: 100
    });
    
    console.log(`\n=== Total Products: ${count} ===\n`);
    
    // List all variants with their SKUs
    const [variants, variantCount] = await productModuleService.listAndCountProductVariants({}, {
      take: 100
    });
    
    console.log(`\n=== Total Variants: ${variantCount} ===\n`);
    console.log("Existing SKUs:");
    variants.forEach(v => {
      console.log(`  - ${v.sku || 'NO SKU'} (${v.title})`);
    });
    
    // Check for duplicate SKUs
    const skuMap = new Map();
    variants.forEach(v => {
      if (v.sku) {
        if (!skuMap.has(v.sku)) {
          skuMap.set(v.sku, []);
        }
        skuMap.get(v.sku).push(v);
      }
    });
    
    console.log("\n=== Duplicate SKUs ===");
    let hasDuplicates = false;
    skuMap.forEach((variants, sku) => {
      if (variants.length > 1) {
        hasDuplicates = true;
        console.log(`SKU "${sku}" appears ${variants.length} times`);
      }
    });
    
    if (!hasDuplicates) {
      console.log("No duplicate SKUs found");
    }
    
  } catch (error) {
    console.error("Error checking products:", error);
  }
}