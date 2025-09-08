/**
 * Create Fabric Use Case
 * Handles fabric creation with all business rules
 * Single Responsibility: Orchestrate fabric creation workflow
 */

import { Result } from '../../../shared/utils/result.util';
import { Fabric, FabricProperties } from '../../../domain/entities/fabric/fabric.entity';
import { FabricId } from '../../../domain/value-objects/fabric-id.vo';
import { SKU } from '../../../domain/value-objects/sku.vo';
import { Money } from '../../../domain/value-objects/money.vo';
import { Quantity } from '../../../domain/value-objects/quantity.vo';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { IFabricRepository } from '../../../domain/repositories/fabric.repository.interface.ts';
import { CreateFabricCommand } from '../../commands/fabric/create-fabric.command';
import { CreateFabricResponse } from '../../dto/responses/fabric.response.dto';
import { ISlugGenerator } from '../../interfaces/services/slug-generator.service.interface';
import { IDomainEventPublisher } from '../../interfaces/services/domain-event-publisher.interface';
import { 
  DuplicateFabricException,
  ValidationException 
} from '../../../domain/exceptions/domain.exceptions';

export class CreateFabricUseCase {
  constructor(
    private readonly fabricRepository: IFabricRepository,
    private readonly slugGenerator: ISlugGenerator,
    private readonly eventPublisher: IDomainEventPublisher
  ) {}

  async execute(command: CreateFabricCommand): Promise<Result<CreateFabricResponse>> {
    try {
      // 1. Validate command and business rules
      const validationResult = await this.validateCommand(command);
      if (validationResult.isFailure()) {
        return Result.failure(validationResult.getError());
      }

      // 2. Create domain value objects
      const valueObjects = await this.createValueObjects(command);
      if (valueObjects.isFailure()) {
        return Result.failure(valueObjects.getError());
      }

      const { sku, retailPrice, wholesalePrice, stockQuantity, availableQuantity, reservedQuantity, reorderPoint, slug } = valueObjects.getValue();

      // 3. Build fabric properties
      const properties: FabricProperties = {
        sku,
        name: command.name.trim(),
        description: command.description?.trim(),
        slug,
        type: command.type,
        status: command.status!,
        retailPrice,
        wholesalePrice,
        stockQuantity,
        availableQuantity,
        reservedQuantity,
        reorderPoint,
        manufacturerName: command.manufacturerName?.trim(),
        collection: command.collection?.trim(),
        colorFamily: command.colorFamily?.trim(),
        pattern: command.pattern?.trim(),
        width: command.width?.trim(),
        weight: command.weight?.trim(),
        composition: command.composition?.trim(),
        careInstructions: command.careInstructions?.trim(),
        properties: command.properties,
        tags: command.tags,
        imageUrl: command.imageUrl?.trim(),
        swatchImageUrl: command.swatchImageUrl?.trim(),
        featured: command.featured || false
      };

      // 4. Create fabric entity
      const createdBy = command.createdBy ? UserId.create(command.createdBy) : undefined;
      const fabric = Fabric.create(properties, createdBy);

      // 5. Persist to repository
      const saveResult = await this.fabricRepository.save(fabric);
      if (saveResult.isFailure()) {
        return Result.failure(`Failed to save fabric: ${saveResult.getError()}`);
      }

      // 6. Publish domain events
      await this.publishDomainEvents(fabric);

      // 7. Return response
      const response: CreateFabricResponse = {
        id: fabric.id.value,
        sku: fabric.sku.value,
        name: fabric.name,
        slug: fabric.slug,
        status: fabric.status,
        retailPrice: fabric.retailPrice.toJSON(),
        stockQuantity: fabric.stockQuantity.toJSON(),
        createdAt: fabric.auditFields.createdAt
      };

      return Result.success(response);

    } catch (error: any) {
      return Result.failure(`Unexpected error creating fabric: ${error.message}`);
    }
  }

  private async validateCommand(command: CreateFabricCommand): Promise<Result<void>> {
    // Check for duplicate SKU
    const skuResult = await this.checkSkuUniqueness(command.sku);
    if (skuResult.isFailure()) {
      return skuResult;
    }

    // Check for duplicate slug if provided
    if (command.slug) {
      const slugResult = await this.checkSlugUniqueness(command.slug);
      if (slugResult.isFailure()) {
        return slugResult;
      }
    }

    // Validate business rules
    return this.validateBusinessRules(command);
  }

  private async checkSkuUniqueness(sku: string): Promise<Result<void>> {
    try {
      const skuObj = SKU.create(sku);
      const existsResult = await this.fabricRepository.skuExists(skuObj);
      
      if (existsResult.isFailure()) {
        return Result.failure(`Error checking SKU uniqueness: ${existsResult.getError()}`);
      }

      if (existsResult.getValue()) {
        return Result.failure(`Fabric with SKU '${sku}' already exists`);
      }

      return Result.success(undefined);
    } catch (error: any) {
      return Result.failure(`Invalid SKU format: ${error.message}`);
    }
  }

  private async checkSlugUniqueness(slug: string): Promise<Result<void>> {
    const existsResult = await this.fabricRepository.slugExists(slug);
    
    if (existsResult.isFailure()) {
      return Result.failure(`Error checking slug uniqueness: ${existsResult.getError()}`);
    }

    if (existsResult.getValue()) {
      return Result.failure(`Fabric with slug '${slug}' already exists`);
    }

    return Result.success(undefined);
  }

  private validateBusinessRules(command: CreateFabricCommand): Result<void> {
    const errors: string[] = [];

    // Name validation
    if (!command.name?.trim()) {
      errors.push('Fabric name is required');
    }

    // Pricing validation
    if (command.retailPrice <= 0) {
      errors.push('Retail price must be greater than zero');
    }

    if (command.wholesalePrice && command.wholesalePrice >= command.retailPrice) {
      errors.push('Wholesale price must be less than retail price');
    }

    // Stock validation
    if (command.stockQuantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }

    if (command.availableQuantity && command.availableQuantity < 0) {
      errors.push('Available quantity cannot be negative');
    }

    if (command.availableQuantity && command.availableQuantity > command.stockQuantity) {
      errors.push('Available quantity cannot exceed stock quantity');
    }

    if (command.reorderPoint && command.reorderPoint < 0) {
      errors.push('Reorder point cannot be negative');
    }

    if (errors.length > 0) {
      return Result.failure(errors.join('; '));
    }

    return Result.success(undefined);
  }

  private async createValueObjects(command: CreateFabricCommand): Promise<Result<{
    sku: SKU;
    retailPrice: Money;
    wholesalePrice?: Money;
    stockQuantity: Quantity;
    availableQuantity: Quantity;
    reservedQuantity: Quantity;
    reorderPoint?: Quantity;
    slug: string;
  }>> {
    try {
      const sku = SKU.create(command.sku);
      const retailPrice = Money.create(command.retailPrice, command.currency);
      const wholesalePrice = command.wholesalePrice 
        ? Money.create(command.wholesalePrice, command.currency)
        : undefined;
      
      const stockQuantity = Quantity.create(command.stockQuantity, command.quantityUnit);
      const availableQuantity = Quantity.create(
        command.availableQuantity || command.stockQuantity, 
        command.quantityUnit
      );
      const reservedQuantity = Quantity.zero(command.quantityUnit);
      const reorderPoint = command.reorderPoint 
        ? Quantity.create(command.reorderPoint, command.quantityUnit)
        : undefined;

      // Generate slug if not provided
      const slug = command.slug || await this.generateUniqueSlug(command.name);

      return Result.success({
        sku,
        retailPrice,
        wholesalePrice,
        stockQuantity,
        availableQuantity,
        reservedQuantity,
        reorderPoint,
        slug
      });

    } catch (error: any) {
      return Result.failure(`Error creating value objects: ${error.message}`);
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let baseSlug = this.slugGenerator.generate(name);
    let finalSlug = baseSlug;
    let suffix = 0;

    while (true) {
      const existsResult = await this.fabricRepository.slugExists(finalSlug);
      
      if (existsResult.isFailure()) {
        // If we can't check, use timestamp to ensure uniqueness
        return `${baseSlug}-${Date.now()}`;
      }

      if (!existsResult.getValue()) {
        return finalSlug;
      }

      suffix++;
      finalSlug = `${baseSlug}-${suffix}`;
    }
  }

  private async publishDomainEvents(fabric: Fabric): Promise<void> {
    const events = fabric.domainEvents;
    
    for (const event of events) {
      try {
        await this.eventPublisher.publish(event);
      } catch (error: any) {
        // Log error but don't fail the entire operation
        console.error(`Failed to publish event ${event.eventType}:`, error);
      }
    }

    fabric.clearDomainEvents();
  }
}