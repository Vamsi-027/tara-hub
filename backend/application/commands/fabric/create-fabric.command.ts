/**
 * Create Fabric Command
 * Immutable command object for fabric creation requests
 */

import { FabricType, FabricStatus } from '../../../domain/entities/fabric/fabric.entity';

export interface CreateFabricCommand {
  readonly sku: string;
  readonly name: string;
  readonly description?: string;
  readonly slug?: string;
  readonly type: FabricType;
  readonly status?: FabricStatus;
  readonly retailPrice: number;
  readonly wholesalePrice?: number;
  readonly currency: string;
  readonly stockQuantity: number;
  readonly availableQuantity?: number;
  readonly quantityUnit: string;
  readonly reorderPoint?: number;
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
  readonly createdBy?: string;
}

export class CreateFabricCommandBuilder {
  private command: Partial<CreateFabricCommand> = {};

  sku(sku: string): CreateFabricCommandBuilder {
    this.command.sku = sku;
    return this;
  }

  name(name: string): CreateFabricCommandBuilder {
    this.command.name = name;
    return this;
  }

  description(description?: string): CreateFabricCommandBuilder {
    this.command.description = description;
    return this;
  }

  slug(slug?: string): CreateFabricCommandBuilder {
    this.command.slug = slug;
    return this;
  }

  type(type: FabricType): CreateFabricCommandBuilder {
    this.command.type = type;
    return this;
  }

  status(status?: FabricStatus): CreateFabricCommandBuilder {
    this.command.status = status;
    return this;
  }

  pricing(retailPrice: number, currency: string = 'USD', wholesalePrice?: number): CreateFabricCommandBuilder {
    this.command.retailPrice = retailPrice;
    this.command.currency = currency;
    this.command.wholesalePrice = wholesalePrice;
    return this;
  }

  stock(stockQuantity: number, unit: string = 'yards', availableQuantity?: number, reorderPoint?: number): CreateFabricCommandBuilder {
    this.command.stockQuantity = stockQuantity;
    this.command.quantityUnit = unit;
    this.command.availableQuantity = availableQuantity;
    this.command.reorderPoint = reorderPoint;
    return this;
  }

  details(details: {
    manufacturerName?: string;
    collection?: string;
    colorFamily?: string;
    pattern?: string;
    width?: string;
    weight?: string;
    composition?: string;
    careInstructions?: string;
  }): CreateFabricCommandBuilder {
    Object.assign(this.command, details);
    return this;
  }

  metadata(properties?: string[], tags?: string[]): CreateFabricCommandBuilder {
    this.command.properties = properties;
    this.command.tags = tags;
    return this;
  }

  images(imageUrl?: string, swatchImageUrl?: string): CreateFabricCommandBuilder {
    this.command.imageUrl = imageUrl;
    this.command.swatchImageUrl = swatchImageUrl;
    return this;
  }

  featured(featured: boolean = false): CreateFabricCommandBuilder {
    this.command.featured = featured;
    return this;
  }

  createdBy(userId?: string): CreateFabricCommandBuilder {
    this.command.createdBy = userId;
    return this;
  }

  build(): CreateFabricCommand {
    this.validateRequired();
    this.setDefaults();
    return this.command as CreateFabricCommand;
  }

  private validateRequired(): void {
    const required = ['sku', 'name', 'type', 'retailPrice', 'stockQuantity'];
    for (const field of required) {
      if (this.command[field as keyof CreateFabricCommand] === undefined) {
        throw new Error(`${field} is required`);
      }
    }
  }

  private setDefaults(): void {
    if (!this.command.currency) this.command.currency = 'USD';
    if (!this.command.quantityUnit) this.command.quantityUnit = 'yards';
    if (!this.command.status) this.command.status = FabricStatus.ACTIVE;
    if (!this.command.featured) this.command.featured = false;
    if (this.command.availableQuantity === undefined) {
      this.command.availableQuantity = this.command.stockQuantity;
    }
  }
}