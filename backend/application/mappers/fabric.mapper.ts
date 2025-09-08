/**
 * Fabric Mapper
 * Maps between domain entities and DTOs
 * Single Responsibility: Handle entity ↔ DTO transformations
 */

import { Fabric } from '../../domain/entities/fabric/fabric.entity';
import { 
  FabricDetailResponse, 
  FabricListResponse 
} from '../dto/responses/fabric.response.dto';

export class FabricMapper {
  
  async toDetailResponse(fabric: Fabric): Promise<FabricDetailResponse> {
    return {
      id: fabric.id.value,
      sku: fabric.sku.value,
      name: fabric.name,
      description: fabric.description,
      slug: fabric.slug,
      type: fabric.type,
      status: fabric.status,
      retailPrice: fabric.retailPrice.toJSON(),
      wholesalePrice: fabric.wholesalePrice?.toJSON(),
      stockQuantity: fabric.stockQuantity.toJSON(),
      availableQuantity: fabric.availableQuantity.toJSON(),
      reservedQuantity: fabric.reservedQuantity.toJSON(),
      reorderPoint: fabric.reorderPoint?.toJSON(),
      manufacturerName: fabric.manufacturerName,
      collection: fabric.collection,
      colorFamily: fabric.colorFamily,
      pattern: fabric.pattern,
      width: fabric.width,
      weight: fabric.weight,
      composition: fabric.composition,
      careInstructions: fabric.careInstructions,
      properties: fabric.properties,
      tags: fabric.tags,
      imageUrl: fabric.imageUrl,
      swatchImageUrl: fabric.swatchImageUrl,
      featured: fabric.featured,
      metrics: {
        viewCount: fabric.metrics.viewCount,
        favoriteCount: fabric.metrics.favoriteCount,
        sampleRequestCount: fabric.metrics.sampleRequestCount,
        averageRating: fabric.metrics.averageRating,
        ratingCount: fabric.metrics.ratingCount
      },
      businessStatus: {
        needsReorder: fabric.needsReorder(),
        isOutOfStock: fabric.isOutOfStock(),
        isLowStock: fabric.isLowStock()
      },
      auditFields: {
        createdAt: fabric.auditFields.createdAt,
        updatedAt: fabric.auditFields.updatedAt,
        createdBy: fabric.auditFields.createdBy,
        updatedBy: fabric.auditFields.updatedBy
      }
    };
  }

  async toListResponse(fabric: Fabric): Promise<FabricListResponse> {
    return {
      id: fabric.id.value,
      sku: fabric.sku.value,
      name: fabric.name,
      slug: fabric.slug,
      type: fabric.type,
      status: fabric.status,
      retailPrice: fabric.retailPrice.toJSON(),
      stockQuantity: fabric.stockQuantity.toJSON(),
      availableQuantity: fabric.availableQuantity.toJSON(),
      manufacturerName: fabric.manufacturerName,
      collection: fabric.collection,
      colorFamily: fabric.colorFamily,
      imageUrl: fabric.imageUrl,
      swatchImageUrl: fabric.swatchImageUrl,
      featured: fabric.featured,
      businessStatus: {
        needsReorder: fabric.needsReorder(),
        isOutOfStock: fabric.isOutOfStock(),
        isLowStock: fabric.isLowStock()
      },
      metrics: {
        viewCount: fabric.metrics.viewCount,
        favoriteCount: fabric.metrics.favoriteCount
      },
      updatedAt: fabric.auditFields.updatedAt
    };
  }

  async toListResponses(fabrics: Fabric[]): Promise<FabricListResponse[]> {
    return Promise.all(fabrics.map(fabric => this.toListResponse(fabric)));
  }
}