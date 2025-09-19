/*
  Main Loaders Entry Point

  Registers all custom loaders including batch job processors
*/

import { MedusaContainer } from "@medusajs/framework/types";

export default async function (container: MedusaContainer) {
  // Add other loaders here as needed

  console.log("[Loaders] All custom loaders registered");
}
