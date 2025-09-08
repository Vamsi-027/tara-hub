/**
 * Price Updated Domain Event
 */

import { DomainEvent } from './base.event';

export interface PriceUpdatedEventData {
  fabricId: string;
  sku: string;
  previousRetailPrice: {
    amount: number;
    currency: string;
  };
  newRetailPrice: {
    amount: number;
    currency: string;
  };
  previousWholesalePrice?: {
    amount: number;
    currency: string;
  };
  newWholesalePrice?: {
    amount: number;
    currency: string;
  };
  reason?: string;
  updatedBy?: string;
  priceIncrease: boolean;
  percentageChange: number;
  timestamp: string;
}

export class PriceUpdatedEvent extends DomainEvent {
  constructor(
    private readonly data: PriceUpdatedEventData
  ) {
    super('fabric.price.updated', data.fabricId);
  }

  get fabricId(): string {
    return this.data.fabricId;
  }

  get sku(): string {
    return this.data.sku;
  }

  get previousRetailPrice(): { amount: number; currency: string } {
    return this.data.previousRetailPrice;
  }

  get newRetailPrice(): { amount: number; currency: string } {
    return this.data.newRetailPrice;
  }

  get priceIncrease(): boolean {
    return this.data.priceIncrease;
  }

  get percentageChange(): number {
    return this.data.percentageChange;
  }

  serialize(): Record<string, any> {
    return {
      fabricId: this.data.fabricId,
      sku: this.data.sku,
      previousRetailPrice: this.data.previousRetailPrice,
      newRetailPrice: this.data.newRetailPrice,
      previousWholesalePrice: this.data.previousWholesalePrice,
      newWholesalePrice: this.data.newWholesalePrice,
      reason: this.data.reason,
      updatedBy: this.data.updatedBy,
      priceIncrease: this.data.priceIncrease,
      percentageChange: this.data.percentageChange,
      timestamp: this.data.timestamp
    };
  }
}