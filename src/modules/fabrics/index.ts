/**
 * Fabrics Module Public API
 * 
 * This module handles all fabric-related functionality including:
 * - Fabric CRUD operations
 * - CSV/Excel import/export
 * - Image management via Cloudflare R2
 * - Search and filtering
 * - Inventory management
 */

// Services
export { FabricService } from './services/fabric.service';

// Service instances
import { FabricService } from './services/fabric.service';
export const fabricService = new FabricService();

// Repositories
export { FabricRepository } from './repositories/fabric.repository';

// Hooks are exported in index.client.ts for client-side use only

// Types
export type {
  Fabric,
  FabricFilter,
  FabricFormData,
  CreateFabricDto,
  UpdateFabricDto,
  ImportResult
} from './types';

// Schemas (for validation) - export what actually exists
export { fabrics, selectFabricSchema, insertFabricSchema } from './schemas/fabric.schema';