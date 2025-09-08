/**
 * Fabric Created Domain Event
 */

import { DomainEvent } from './base.event';

export interface FabricCreatedEventData {
  fabricId: string;
  sku: string;
  name: string;
  type: string;
  status: string;
  retailPrice: {
    amount: number;
    currency: string;
  };
  stockQuantity: {
    amount: number;
    unit: string;
  };
  createdBy?: string;
  timestamp: string;
}

export class FabricCreatedEvent extends DomainEvent {
  constructor(
    private readonly data: FabricCreatedEventData
  ) {
    super('fabric.created', data.fabricId);
  }

  get fabricId(): string {
    return this.data.fabricId;
  }

  get sku(): string {
    return this.data.sku;
  }

  get name(): string {
    return this.data.name;
  }

  get createdBy(): string | undefined {
    return this.data.createdBy;
  }

  serialize(): Record<string, any> {
    return {
      fabricId: this.data.fabricId,
      sku: this.data.sku,
      name: this.data.name,
      type: this.data.type,
      status: this.data.status,
      retailPrice: this.data.retailPrice,
      stockQuantity: this.data.stockQuantity,
      createdBy: this.data.createdBy,
      timestamp: this.data.timestamp
    };
  }
}