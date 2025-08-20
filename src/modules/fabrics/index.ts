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

// Repositories
export { FabricRepository } from './repositories/fabric.repository';

// Hooks
export { useFabrics } from './hooks/use-fabrics';
export { useFabricDetail } from './hooks/use-fabric-detail';

// Types
export type {
  Fabric,
  FabricFilter,
  FabricFormData,
  CreateFabricDto,
  UpdateFabricDto,
  ImportResult
} from './types';

// Schemas (for validation)
export { fabricSchema, fabricFilterSchema } from './schemas/fabric.schema';