/**
 * Stock Updated Domain Event
 */

import { DomainEvent } from './base.event';

export enum StockOperation {
  ADD = 'add',
  REMOVE = 'remove',
  SET = 'set',
  RESERVE = 'reserve',
  RELEASE = 'release'
}

export interface StockUpdatedEventData {
  fabricId: string;
  sku: string;
  operation: StockOperation;
  quantity: {
    amount: number;
    unit: string;
  };
  previousAvailableQuantity: {
    amount: number;
    unit: string;
  };
  newAvailableQuantity: {
    amount: number;
    unit: string;
  };
  reason?: string;
  updatedBy?: string;
  isLowStock: boolean;
  needsReorder: boolean;
  timestamp: string;
}

export class StockUpdatedEvent extends DomainEvent {
  constructor(
    private readonly data: StockUpdatedEventData
  ) {
    super('fabric.stock.updated', data.fabricId);
  }

  get fabricId(): string {
    return this.data.fabricId;
  }

  get sku(): string {
    return this.data.sku;
  }

  get operation(): StockOperation {
    return this.data.operation;
  }

  get quantity(): { amount: number; unit: string } {
    return this.data.quantity;
  }

  get isLowStock(): boolean {
    return this.data.isLowStock;
  }

  get needsReorder(): boolean {
    return this.data.needsReorder;
  }

  serialize(): Record<string, any> {
    return {
      fabricId: this.data.fabricId,
      sku: this.data.sku,
      operation: this.data.operation,
      quantity: this.data.quantity,
      previousAvailableQuantity: this.data.previousAvailableQuantity,
      newAvailableQuantity: this.data.newAvailableQuantity,
      reason: this.data.reason,
      updatedBy: this.data.updatedBy,
      isLowStock: this.data.isLowStock,
      needsReorder: this.data.needsReorder,
      timestamp: this.data.timestamp
    };
  }
}