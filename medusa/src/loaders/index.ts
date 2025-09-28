/*
  Main Loaders Entry Point

  Registers all custom loaders including batch job processors
*/

import { MedusaContainer } from "@medusajs/framework/types";
import { asClass, Lifetime } from "awilix";

import MaterialsSyncService from "../services/materials-sync.service";

export default async function (container: MedusaContainer) {
  container.register({
    materialsSyncService: asClass(MaterialsSyncService, {
      lifetime: Lifetime.SINGLETON,
    }),
  })

  console.log("[Loaders] All custom loaders registered");
}
