/**
 * Fabric Domain Entity (Aggregate Root)
 * Rich domain model with business logic and invariants
 */

import { AggregateRoot, AuditFields } from '../base.entity';
import { FabricId } from '../../value-objects/fabric-id.vo';
import { SKU } from '../../value-objects/sku.vo';
import { Money } from '../../value-objects/money.vo';
import { Quantity } from '../../value-objects/quantity.vo';
import { UserId } from '../../value-objects/user-id.vo';
import {
  InvalidOperationException,
  BusinessRuleViolationException,
  InsufficientStockException,
  InvalidPricingException,
  CannotModifyDeletedFabricException
} from '../../exceptions/domain.exceptions';
import { FabricCreatedEvent } from '../../events/fabric-created.event';
import { StockUpdatedEvent, StockOperation } from '../../events/stock-updated.event';
import { PriceUpdatedEvent } from '../../events/price-updated.event';

export enum FabricType {
  UPHOLSTERY = 'Upholstery',
  DRAPERY = 'Drapery',
  TRIM = 'Trim',
  WALLCOVERING = 'Wallcovering',
  OUTDOOR = 'Outdoor'
}

export enum FabricStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  DISCONTINUED = 'Discontinued',
  OUT_OF_STOCK = 'Out of Stock'
}

export interface FabricProperties {
  sku: SKU;
  name: string;
  description?: string;
  slug: string;
  type: FabricType;
  status: FabricStatus;
  retailPrice: Money;
  wholesalePrice?: Money;
  stockQuantity: Quantity;
  availableQuantity: Quantity;
  reservedQuantity: Quantity;
  reorderPoint?: Quantity;
  manufacturerName?: string;
  collection?: string;
  colorFamily?: string;
  pattern?: string;
  width?: string;
  weight?: string;
  composition?: string;
  careInstructions?: string;
  properties?: string[];
  tags?: string[];
  imageUrl?: string;
  swatchImageUrl?: string;
  featured: boolean;
}

export interface FabricMetrics {
  viewCount: number;
  favoriteCount: number;
  sampleRequestCount: number;
  averageRating?: number;
  ratingCount: number;
}

export class Fabric extends AggregateRoot<FabricId> {
  private _sku: SKU;
  private _name: string;
  private _description?: string;
  private _slug: string;
  private _type: FabricType;
  private _status: FabricStatus;
  private _retailPrice: Money;
  private _wholesalePrice?: Money;
  private _stockQuantity: Quantity;
  private _availableQuantity: Quantity;
  private _reservedQuantity: Quantity;
  private _reorderPoint?: Quantity;
  private _manufacturerName?: string;
  private _collection?: string;
  private _colorFamily?: string;
  private _pattern?: string;
  private _width?: string;
  private _weight?: string;
  private _composition?: string;
  private _careInstructions?: string;
  private _properties?: string[];
  private _tags?: string[];
  private _imageUrl?: string;
  private _swatchImageUrl?: string;
  private _featured: boolean;
  private _metrics: FabricMetrics;
  private _auditFields: AuditFields;

  constructor(
    id: FabricId,
    properties: FabricProperties,
    auditFields: AuditFields,
    metrics: FabricMetrics = {
      viewCount: 0,
      favoriteCount: 0,
      sampleRequestCount: 0,
      ratingCount: 0
    }
  ) {
    super(id);
    this.validateBusinessInvariants(properties);
    
    this._sku = properties.sku;
    this._name = properties.name;
    this._description = properties.description;
    this._slug = properties.slug;
    this._type = properties.type;
    this._status = properties.status;
    this._retailPrice = properties.retailPrice;
    this._wholesalePrice = properties.wholesalePrice;
    this._stockQuantity = properties.stockQuantity;
    this._availableQuantity = properties.availableQuantity;
    this._reservedQuantity = properties.reservedQuantity;
    this._reorderPoint = properties.reorderPoint;
    this._manufacturerName = properties.manufacturerName;
    this._collection = properties.collection;
    this._colorFamily = properties.colorFamily;
    this._pattern = properties.pattern;
    this._width = properties.width;
    this._weight = properties.weight;
    this._composition = properties.composition;
    this._careInstructions = properties.careInstructions;
    this._properties = properties.properties;
    this._tags = properties.tags;
    this._imageUrl = properties.imageUrl;
    this._swatchImageUrl = properties.swatchImageUrl;
    this._featured = properties.featured;
    this._metrics = metrics;
    this._auditFields = auditFields;
  }

  // Factory method for creating new fabrics
  static create(
    properties: FabricProperties,
    createdBy?: UserId
  ): Fabric {
    const id = FabricId.generate();
    const now = new Date();
    
    const auditFields: AuditFields = {
      createdAt: now,
      updatedAt: now,
      createdBy: createdBy?.value
    };

    const fabric = new Fabric(id, properties, auditFields);

    // Domain event for fabric creation
    fabric.addDomainEvent(new FabricCreatedEvent({
      fabricId: id.value,
      sku: properties.sku.value,
      name: properties.name,
      type: properties.type,
      status: properties.status,
      retailPrice: properties.retailPrice.toJSON(),
      stockQuantity: properties.stockQuantity.toJSON(),
      createdBy: createdBy?.value,
      timestamp: now.toISOString()
    }));

    return fabric;
  }

  // Getters
  get sku(): SKU { return this._sku; }
  get name(): string { return this._name; }
  get description(): string | undefined { return this._description; }
  get slug(): string { return this._slug; }
  get type(): FabricType { return this._type; }
  get status(): FabricStatus { return this._status; }
  get retailPrice(): Money { return this._retailPrice; }
  get wholesalePrice(): Money | undefined { return this._wholesalePrice; }
  get stockQuantity(): Quantity { return this._stockQuantity; }
  get availableQuantity(): Quantity { return this._availableQuantity; }
  get reservedQuantity(): Quantity { return this._reservedQuantity; }
  get reorderPoint(): Quantity | undefined { return this._reorderPoint; }
  get manufacturerName(): string | undefined { return this._manufacturerName; }
  get collection(): string | undefined { return this._collection; }
  get colorFamily(): string | undefined { return this._colorFamily; }
  get pattern(): string | undefined { return this._pattern; }
  get width(): string | undefined { return this._width; }
  get weight(): string | undefined { return this._weight; }
  get composition(): string | undefined { return this._composition; }
  get careInstructions(): string | undefined { return this._careInstructions; }
  get properties(): string[] | undefined { return this._properties; }
  get tags(): string[] | undefined { return this._tags; }
  get imageUrl(): string | undefined { return this._imageUrl; }
  get swatchImageUrl(): string | undefined { return this._swatchImageUrl; }
  get featured(): boolean { return this._featured; }
  get metrics(): FabricMetrics { return this._metrics; }
  get auditFields(): AuditFields { return this._auditFields; }
  get isDeleted(): boolean { return !!this._auditFields.deletedAt; }

  // Business Logic Methods

  updateStock(
    operation: StockOperation,
    quantity: Quantity,
    reason?: string,
    updatedBy?: UserId
  ): void {
    this.ensureNotDeleted();
    this.ensureSameUnit(quantity);

    const previousAvailable = this._availableQuantity;
    const now = new Date();

    switch (operation) {
      case StockOperation.ADD:
        this._stockQuantity = this._stockQuantity.add(quantity);
        this._availableQuantity = this._availableQuantity.add(quantity);
        break;

      case StockOperation.REMOVE:
        if (!this._availableQuantity.isSufficient(quantity)) {
          throw new InsufficientStockException(
            this._availableQuantity.amount,
            quantity.amount,
            quantity.unit
          );
        }
        this._stockQuantity = this._stockQuantity.subtract(quantity);
        this._availableQuantity = this._availableQuantity.subtract(quantity);
        break;

      case StockOperation.SET:
        this._stockQuantity = quantity;
        // Ensure available doesn't exceed new stock
        if (this._availableQuantity.isGreaterThan(quantity)) {
          this._availableQuantity = quantity.subtract(this._reservedQuantity);
        }
        break;

      case StockOperation.RESERVE:
        if (!this._availableQuantity.isSufficient(quantity)) {
          throw new InsufficientStockException(
            this._availableQuantity.amount,
            quantity.amount,
            quantity.unit
          );
        }
        this._availableQuantity = this._availableQuantity.subtract(quantity);
        this._reservedQuantity = this._reservedQuantity.add(quantity);
        break;

      case StockOperation.RELEASE:
        if (!this._reservedQuantity.isSufficient(quantity)) {
          throw new BusinessRuleViolationException(
            `Cannot release ${quantity.format()}. Only ${this._reservedQuantity.format()} is reserved.`
          );
        }
        this._reservedQuantity = this._reservedQuantity.subtract(quantity);
        this._availableQuantity = this._availableQuantity.add(quantity);
        break;
    }

    this.updateAuditFields(updatedBy);
    this.updateStatusBasedOnStock();

    // Domain event
    this.addDomainEvent(new StockUpdatedEvent({
      fabricId: this.id.value,
      sku: this._sku.value,
      operation,
      quantity: quantity.toJSON(),
      previousAvailableQuantity: previousAvailable.toJSON(),
      newAvailableQuantity: this._availableQuantity.toJSON(),
      reason,
      updatedBy: updatedBy?.value,
      isLowStock: this.isLowStock(),
      needsReorder: this.needsReorder(),
      timestamp: now.toISOString()
    }));
  }

  updatePricing(
    newRetailPrice: Money,
    newWholesalePrice?: Money,
    reason?: string,
    updatedBy?: UserId
  ): void {
    this.ensureNotDeleted();
    this.validatePricing(newRetailPrice, newWholesalePrice);

    const previousRetailPrice = this._retailPrice;
    const previousWholesalePrice = this._wholesalePrice;

    this._retailPrice = newRetailPrice;
    this._wholesalePrice = newWholesalePrice;
    this.updateAuditFields(updatedBy);

    // Calculate percentage change
    const percentageChange = ((newRetailPrice.amount - previousRetailPrice.amount) / previousRetailPrice.amount) * 100;

    // Domain event
    this.addDomainEvent(new PriceUpdatedEvent({
      fabricId: this.id.value,
      sku: this._sku.value,
      previousRetailPrice: previousRetailPrice.toJSON(),
      newRetailPrice: newRetailPrice.toJSON(),
      previousWholesalePrice: previousWholesalePrice?.toJSON(),
      newWholesalePrice: newWholesalePrice?.toJSON(),
      reason,
      updatedBy: updatedBy?.value,
      priceIncrease: newRetailPrice.isGreaterThan(previousRetailPrice),
      percentageChange: Math.round(percentageChange * 100) / 100,
      timestamp: new Date().toISOString()
    }));
  }

  updateDetails(
    updates: {
      name?: string;
      description?: string;
      type?: FabricType;
      manufacturerName?: string;
      collection?: string;
      colorFamily?: string;
      pattern?: string;
      width?: string;
      weight?: string;
      composition?: string;
      careInstructions?: string;
      properties?: string[];
      tags?: string[];
    },
    updatedBy?: UserId
  ): void {
    this.ensureNotDeleted();

    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new BusinessRuleViolationException('Fabric name cannot be empty');
      }
      this._name = updates.name.trim();
    }

    if (updates.description !== undefined) this._description = updates.description;
    if (updates.type !== undefined) this._type = updates.type;
    if (updates.manufacturerName !== undefined) this._manufacturerName = updates.manufacturerName;
    if (updates.collection !== undefined) this._collection = updates.collection;
    if (updates.colorFamily !== undefined) this._colorFamily = updates.colorFamily;
    if (updates.pattern !== undefined) this._pattern = updates.pattern;
    if (updates.width !== undefined) this._width = updates.width;
    if (updates.weight !== undefined) this._weight = updates.weight;
    if (updates.composition !== undefined) this._composition = updates.composition;
    if (updates.careInstructions !== undefined) this._careInstructions = updates.careInstructions;
    if (updates.properties !== undefined) this._properties = updates.properties;
    if (updates.tags !== undefined) this._tags = updates.tags;

    this.updateAuditFields(updatedBy);
  }

  updateImages(imageUrl?: string, swatchImageUrl?: string, updatedBy?: UserId): void {
    this.ensureNotDeleted();
    
    this._imageUrl = imageUrl;
    this._swatchImageUrl = swatchImageUrl;
    this.updateAuditFields(updatedBy);
  }

  feature(updatedBy?: UserId): void {
    this.ensureNotDeleted();
    this._featured = true;
    this.updateAuditFields(updatedBy);
  }

  unfeature(updatedBy?: UserId): void {
    this.ensureNotDeleted();
    this._featured = false;
    this.updateAuditFields(updatedBy);
  }

  activate(updatedBy?: UserId): void {
    this.ensureNotDeleted();
    if (this.isOutOfStock()) {
      throw new BusinessRuleViolationException('Cannot activate fabric that is out of stock');
    }
    this._status = FabricStatus.ACTIVE;
    this.updateAuditFields(updatedBy);
  }

  deactivate(updatedBy?: UserId): void {
    this._status = FabricStatus.INACTIVE;
    this.updateAuditFields(updatedBy);
  }

  discontinue(updatedBy?: UserId): void {
    this._status = FabricStatus.DISCONTINUED;
    this.updateAuditFields(updatedBy);
  }

  softDelete(deletedBy?: UserId): void {
    if (this.isDeleted) {
      throw new InvalidOperationException('Fabric is already deleted');
    }

    this._status = FabricStatus.INACTIVE;
    this._auditFields.deletedAt = new Date();
    this._auditFields.deletedBy = deletedBy?.value;
    this.updateAuditFields(deletedBy);
  }

  restore(updatedBy?: UserId): void {
    if (!this.isDeleted) {
      throw new InvalidOperationException('Fabric is not deleted');
    }

    this._auditFields.deletedAt = undefined;
    this._auditFields.deletedBy = undefined;
    this._status = this.isOutOfStock() ? FabricStatus.OUT_OF_STOCK : FabricStatus.ACTIVE;
    this.updateAuditFields(updatedBy);
  }

  // Queries
  needsReorder(): boolean {
    return this._reorderPoint ? this._availableQuantity.isLessThan(this._reorderPoint) : false;
  }

  isOutOfStock(): boolean {
    return this._availableQuantity.isZero();
  }

  isLowStock(): boolean {
    return this.needsReorder() || this.isOutOfStock();
  }

  canReserve(quantity: Quantity): boolean {
    this.ensureSameUnit(quantity);
    return this._availableQuantity.isSufficient(quantity);
  }

  canFulfillOrder(quantity: Quantity): boolean {
    return this.canReserve(quantity) && this._status === FabricStatus.ACTIVE;
  }

  // Metrics operations
  incrementViewCount(): void {
    this._metrics.viewCount++;
  }

  incrementFavoriteCount(): void {
    this._metrics.favoriteCount++;
  }

  decrementFavoriteCount(): void {
    if (this._metrics.favoriteCount > 0) {
      this._metrics.favoriteCount--;
    }
  }

  incrementSampleRequestCount(): void {
    this._metrics.sampleRequestCount++;
  }

  updateRating(newRating: number): void {
    if (newRating < 1 || newRating > 5) {
      throw new BusinessRuleViolationException('Rating must be between 1 and 5');
    }

    const currentTotal = (this._metrics.averageRating || 0) * this._metrics.ratingCount;
    this._metrics.ratingCount++;
    this._metrics.averageRating = (currentTotal + newRating) / this._metrics.ratingCount;
  }

  // Private methods
  private validateBusinessInvariants(properties: FabricProperties): void {
    if (!properties.name?.trim()) {
      throw new BusinessRuleViolationException('Fabric name is required');
    }

    if (!properties.slug?.trim()) {
      throw new BusinessRuleViolationException('Fabric slug is required');
    }

    this.validatePricing(properties.retailPrice, properties.wholesalePrice);
    this.validateStockQuantities(properties);
  }

  private validatePricing(retailPrice: Money, wholesalePrice?: Money): void {
    if (retailPrice.isZero()) {
      throw new InvalidPricingException('Retail price must be greater than zero');
    }

    if (wholesalePrice && !wholesalePrice.isLessThan(retailPrice)) {
      throw new InvalidPricingException('Wholesale price must be less than retail price');
    }
  }

  private validateStockQuantities(properties: FabricProperties): void {
    const { stockQuantity, availableQuantity, reservedQuantity } = properties;

    if (!stockQuantity.isEqual(availableQuantity.add(reservedQuantity))) {
      throw new BusinessRuleViolationException(
        'Stock quantities are inconsistent. Stock = Available + Reserved'
      );
    }

    this.ensureSameUnit(availableQuantity);
    this.ensureSameUnit(reservedQuantity);
  }

  private ensureNotDeleted(): void {
    if (this.isDeleted) {
      throw new CannotModifyDeletedFabricException(this.id.value);
    }
  }

  private ensureSameUnit(quantity: Quantity): void {
    if (this._stockQuantity.unit !== quantity.unit) {
      throw new BusinessRuleViolationException(
        `Unit mismatch: expected ${this._stockQuantity.unit}, got ${quantity.unit}`
      );
    }
  }

  private updateAuditFields(updatedBy?: UserId): void {
    this._auditFields.updatedAt = new Date();
    if (updatedBy) {
      this._auditFields.updatedBy = updatedBy.value;
    }
  }

  private updateStatusBasedOnStock(): void {
    if (this.isOutOfStock() && this._status === FabricStatus.ACTIVE) {
      this._status = FabricStatus.OUT_OF_STOCK;
    } else if (!this.isOutOfStock() && this._status === FabricStatus.OUT_OF_STOCK) {
      this._status = FabricStatus.ACTIVE;
    }
  }
}