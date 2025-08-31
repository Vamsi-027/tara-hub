import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";

export default async function testProductCreation({ container }: ExecArgs) {
  const productModuleService = container.resolve(Modules.PRODUCT);
  
  try {
    console.log("\n=== Testing Product Creation ===\n");
    
    // Generate unique handles and SKUs with timestamp
    const timestamp = Date.now();
    const handle = `test-fabric-${timestamp}`;
    const skuBase = handle;
    
    console.log(`Creating product with handle: ${handle}`);
    console.log(`SKU base: ${skuBase}`);
    
    const productData = {
      title: "Test Fabric Product",
      handle: handle,
      description: "This is a test fabric product created to verify the fix",
      status: "draft",
      options: [
        {
          title: "Type",
          values: ["Swatch", "Fabric"]
        }
      ],
      variants: [
        {
          title: "Swatch Sample",
          sku: `${skuBase}-SWATCH`,
          manage_inventory: false,
          options: { Type: "Swatch" },
          prices: [{ amount: 500, currency_code: "usd" }]
        },
        {
          title: "Fabric Per Yard",
          sku: `${skuBase}-YARD`,
          manage_inventory: false,
          options: { Type: "Fabric" },
          prices: [{ amount: 9900, currency_code: "usd" }]
        }
      ],
      metadata: {
        brand: "Test Brand",
        category: "Upholstery",
        pattern: "Solid",
        color: "Blue",
        composition: "100% Polyester",
        width: "54 inches"
      }
    };
    
    console.log("\nCreating product using workflow...");
    
    // Create product using workflow
    const { result } = await createProductsWorkflow(container).run({
      input: {
        products: [productData]
      }
    });
    
    if (result && result[0]) {
      console.log("\n✅ Product created successfully!");
      console.log(`Product ID: ${result[0].id}`);
      console.log(`Product Title: ${result[0].title}`);
      console.log(`Product Handle: ${result[0].handle}`);
      
      // Verify variants were created
      const [product] = await productModuleService.listProducts({
        id: result[0].id
      }, {
        relations: ["variants"]
      });
      
      console.log(`\nVariants created:`);
      product.variants?.forEach(v => {
        console.log(`  - ${v.title}: SKU ${v.sku}`);
      });
      
      // Test creating another product with same title to ensure unique SKUs
      console.log("\n=== Testing Duplicate Title Handling ===\n");
      
      const timestamp2 = Date.now();
      const handle2 = `test-fabric-${timestamp2}`;
      const skuBase2 = handle2;
      
      console.log(`Creating second product with same title but different timestamp`);
      console.log(`Handle: ${handle2}`);
      console.log(`SKU base: ${skuBase2}`);
      
      const productData2 = {
        ...productData,
        handle: handle2,
        variants: [
          {
            title: "Swatch Sample",
            sku: `${skuBase2}-SWATCH`,
            manage_inventory: false,
            options: { Type: "Swatch" },
            prices: [{ amount: 500, currency_code: "usd" }]
          },
          {
            title: "Fabric Per Yard",
            sku: `${skuBase2}-YARD`,
            manage_inventory: false,
            options: { Type: "Fabric" },
            prices: [{ amount: 9900, currency_code: "usd" }]
          }
        ]
      };
      
      const { result: result2 } = await createProductsWorkflow(container).run({
        input: {
          products: [productData2]
        }
      });
      
      if (result2 && result2[0]) {
        console.log("\n✅ Second product created successfully!");
        console.log(`Product ID: ${result2[0].id}`);
        console.log(`Product Handle: ${result2[0].handle}`);
        
        // Verify variants
        const [product2] = await productModuleService.listProducts({
          id: result2[0].id
        }, {
          relations: ["variants"]
        });
        
        console.log(`\nVariants created:`);
        product2.variants?.forEach(v => {
          console.log(`  - ${v.title}: SKU ${v.sku}`);
        });
        
        console.log("\n🎉 SUCCESS: Product creation is working correctly!");
        console.log("Duplicate SKUs are prevented by using timestamps.");
      }
      
    } else {
      console.error("❌ Product creation failed - no result returned");
    }
    
  } catch (error) {
    console.error("\n❌ Error testing product creation:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
  }
}