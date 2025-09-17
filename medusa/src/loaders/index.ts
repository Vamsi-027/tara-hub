/*
  Main Loaders Entry Point

  Registers all custom loaders including batch job processors
*/

import { MedusaContainer } from "@medusajs/framework/types";
import productImportJobLoader from "./product-import-job";

export default async function (container: MedusaContainer) {
  // Register product import batch job processor
  await productImportJobLoader(container);

  // Add other loaders here as needed

  console.log("[Loaders] All custom loaders registered");
}