"use client"

/**
 * Client-side exports for the Fabrics module
 * Only import this file in client components
 */

// Hooks
export { 
  useFabrics,
  useFabric,
  useCreateFabric,
  useDeleteFabric,
  useBulkFabricOperations,
  useFabricStatistics,
  useFabricFilterOptions,
  useFabricImport
} from './hooks/use-fabrics';

// Types (safe for client)
export type {
  Fabric,
  FabricFilter,
  FabricFormData,
  CreateFabricDto,
  UpdateFabricDto,
  ImportResult
} from './types';