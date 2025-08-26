/**
 * Update Fabric Command
 * Command for updating fabric properties
 */

import { FabricType, FabricStatus } from '../../../domain/entities/fabric/fabric.entity';

export interface UpdateFabricCommand {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly slug?: string;
  readonly type?: FabricType;
  readonly status?: FabricStatus;
  readonly retailPrice?: number;
  readonly wholesalePrice?: number;
  readonly currency?: string;
  readonly manufacturerName?: string;
  readonly collection?: string;
  readonly colorFamily?: string;
  readonly pattern?: string;
  readonly width?: string;
  readonly weight?: string;
  readonly composition?: string;
  readonly careInstructions?: string;
  readonly properties?: string[];
  readonly tags?: string[];
  readonly imageUrl?: string;
  readonly swatchImageUrl?: string;
  readonly featured?: boolean;
  readonly updatedBy?: string;
}

export interface UpdateStockCommand {
  readonly fabricId: string;
  readonly operation: 'add' | 'remove' | 'set' | 'reserve' | 'release';
  readonly quantity: number;
  readonly unit: string;
  readonly reason?: string;
  readonly updatedBy?: string;
}