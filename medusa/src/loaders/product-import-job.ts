/*
  Product Import Batch Job Loader

  Registers the product-import batch job processor with Medusa
*/

import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function productImportJobLoader(container: MedusaContainer) {
  try {
    const jobService = container.resolve("jobService");

    // Register the batch job handler with the job service
    jobService.registerJobHandler("product-import", async (job: any, container: MedusaContainer) => {
      const handler = await import("../jobs/product-import");
      return handler.default(job, container);
    });

    console.log("[ProductImportLoader] Registered product-import batch job processor");
  } catch (error) {
    console.error("[ProductImportLoader] Failed to register job processor:", error);
  }
}