/**
 * Manage Inventory Use Case
 * Handles stock operations with business rules
 * Single Responsibility: Orchestrate inventory management operations
 */

import { Result } from '../../../shared/utils/result.util';
import { Fabric } from '../../../domain/entities/fabric/fabric.entity';
import { FabricId } from '../../../domain/value-objects/fabric-id.vo';
import { Quantity } from '../../../domain/value-objects/quantity.vo';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { IFabricRepository } from '../../../domain/repositories/fabric.repository.interface';
import { UpdateStockCommand } from '../../commands/fabric/update-fabric.command';
import { StockOperation } from '../../../domain/events/stock-updated.event';
import { IDomainEventPublisher } from '../../interfaces/services/domain-event-publisher.interface';
import { FabricNotFoundException } from '../../../domain/exceptions/domain.exceptions';

export interface InventoryReport {
  totalFabrics: number;
  outOfStockCount: number;
  lowStockCount: number;
  needingReorderCount: number;
  totalStockValue: number;
}

export class ManageInventoryUseCase {
  constructor(
    private readonly fabricRepository: IFabricRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async updateStock(command: UpdateStockCommand): Promise<Result<void>> {
    try {
      // 1. Find fabric
      const fabricId = FabricId.create(command.fabricId);
      const fabricResult = await this.fabricRepository.findById(fabricId);
      
      if (fabricResult.isFailure()) {
        return Result.failure(`Error finding fabric: ${fabricResult.getError()}`);
      }

      const fabric = fabricResult.getValue();
      if (!fabric) {
        return Result.failure(`Fabric not found: ${command.fabricId}`);
      }

      // 2. Create quantity value object
      const quantity = Quantity.create(command.quantity, command.unit);
      const updatedBy = command.updatedBy ? UserId.create(command.updatedBy) : undefined;

      // 3. Map command operation to domain operation
      const operation = this.mapToStockOperation(command.operation);

      // 4. Update stock using domain logic
      fabric.updateStock(operation, quantity, command.reason, updatedBy);

      // 5. Save fabric
      const saveResult = await this.fabricRepository.save(fabric);
      if (saveResult.isFailure()) {
        return Result.failure(`Failed to save fabric: ${saveResult.getError()}`);
      }

      // 6. Publish domain events
      await this.publishDomainEvents(fabric);

      return Result.success(undefined);

    } catch (error: any) {
      return Result.failure(`Error updating stock: ${error.message}`);
    }
  }

  async getLowStockFabrics(threshold?: number): Promise<Result<Fabric[]>> {
    try {
      return await this.fabricRepository.findLowStock(threshold);
    } catch (error: any) {
      return Result.failure(`Error finding low stock fabrics: ${error.message}`);
    }
  }

  async getOutOfStockFabrics(): Promise<Result<Fabric[]>> {
    try {
      return await this.fabricRepository.findOutOfStock();
    } catch (error: any) {
      return Result.failure(`Error finding out of stock fabrics: ${error.message}`);
    }
  }

  async getFabricsNeedingReorder(): Promise<Result<Fabric[]>> {
    try {
      return await this.fabricRepository.findNeedingReorder();
    } catch (error: any) {
      return Result.failure(`Error finding fabrics needing reorder: ${error.message}`);
    }
  }

  async getInventoryReport(): Promise<Result<InventoryReport>> {
    try {
      const statisticsResult = await this.fabricRepository.getStatistics();
      
      if (statisticsResult.isFailure()) {
        return Result.failure(`Error getting inventory statistics: ${statisticsResult.getError()}`);
      }

      const stats = statisticsResult.getValue();
      
      const report: InventoryReport = {
        totalFabrics: stats.totalFabrics,
        outOfStockCount: stats.outOfStockFabrics,
        lowStockCount: stats.lowStockFabrics,
        needingReorderCount: 0, // Would need separate query
        totalStockValue: stats.totalStockValue
      };

      return Result.success(report);

    } catch (error: any) {
      return Result.failure(`Error generating inventory report: ${error.message}`);
    }
  }

  async bulkUpdateStock(commands: UpdateStockCommand[]): Promise<Result<{
    successful: number;
    failed: Array<{ fabricId: string; error: string }>;
  }>> {
    const results = {
      successful: 0,
      failed: [] as Array<{ fabricId: string; error: string }>
    };

    for (const command of commands) {
      const result = await this.updateStock(command);
      
      if (result.isSuccess()) {
        results.successful++;
      } else {
        results.failed.push({
          fabricId: command.fabricId,
          error: result.getError()
        });
      }
    }

    return Result.success(results);
  }

  async reserveStock(fabricId: string, quantity: number, unit: string, reason?: string, userId?: string): Promise<Result<void>> {
    const command: UpdateStockCommand = {
      fabricId,
      operation: 'reserve',
      quantity,
      unit,
      reason,
      updatedBy: userId
    };

    return await this.updateStock(command);
  }

  async releaseStock(fabricId: string, quantity: number, unit: string, reason?: string, userId?: string): Promise<Result<void>> {
    const command: UpdateStockCommand = {
      fabricId,
      operation: 'release',
      quantity,
      unit,
      reason,
      updatedBy: userId
    };

    return await this.updateStock(command);
  }

  private mapToStockOperation(operation: string): StockOperation {
    switch (operation) {
      case 'add':
        return StockOperation.ADD;
      case 'remove':
        return StockOperation.REMOVE;
      case 'set':
        return StockOperation.SET;
      case 'reserve':
        return StockOperation.RESERVE;
      case 'release':
        return StockOperation.RELEASE;
      default:
        throw new Error(`Unknown stock operation: ${operation}`);
    }
  }

  private async publishDomainEvents(fabric: Fabric): Promise<void> {
    const events = fabric.domainEvents;
    
    for (const event of events) {
      try {
        await this.eventPublisher.publish(event);
      } catch (error: any) {
        console.error(`Failed to publish event ${event.eventType}:`, error);
      }
    }

    fabric.clearDomainEvents();
  }
}