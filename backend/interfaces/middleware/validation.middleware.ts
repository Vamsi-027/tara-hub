/**
 * Validation Middleware
 * Interface layer - handles request validation
 * Single Responsibility: HTTP request data validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { HttpStatusCode } from '../../shared/constants/http-status.constants';
import { createErrorResponse } from '../../shared/utils/api-response.util';

export interface ValidationOptions {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}

export class ValidationMiddleware {
  static validate(options: ValidationOptions) {
    return async (request: NextRequest, params?: Record<string, string>): Promise<NextResponse | null> => {
      try {
        if (options.body) {
          const body = await request.json();
          const bodyResult = options.body.safeParse(body);
          
          if (!bodyResult.success) {
            return createErrorResponse(
              `Invalid request body: ${bodyResult.error.issues.map(i => i.message).join(', ')}`,
              HttpStatusCode.BAD_REQUEST
            );
          }
        }

        if (options.query) {
          const { searchParams } = new URL(request.url);
          const queryObject = Object.fromEntries(searchParams.entries());
          const queryResult = options.query.safeParse(queryObject);
          
          if (!queryResult.success) {
            return createErrorResponse(
              `Invalid query parameters: ${queryResult.error.issues.map(i => i.message).join(', ')}`,
              HttpStatusCode.BAD_REQUEST
            );
          }
        }

        if (options.params && params) {
          const paramsResult = options.params.safeParse(params);
          
          if (!paramsResult.success) {
            return createErrorResponse(
              `Invalid path parameters: ${paramsResult.error.issues.map(i => i.message).join(', ')}`,
              HttpStatusCode.BAD_REQUEST
            );
          }
        }

        if (options.headers) {
          const headersObject = Object.fromEntries(request.headers.entries());
          const headersResult = options.headers.safeParse(headersObject);
          
          if (!headersResult.success) {
            return createErrorResponse(
              `Invalid headers: ${headersResult.error.issues.map(i => i.message).join(', ')}`,
              HttpStatusCode.BAD_REQUEST
            );
          }
        }

        return null;
      } catch (error) {
        if (error instanceof SyntaxError) {
          return createErrorResponse(
            'Invalid JSON in request body',
            HttpStatusCode.BAD_REQUEST
          );
        }

        return createErrorResponse(
          'Validation failed',
          HttpStatusCode.BAD_REQUEST
        );
      }
    };
  }
}

export const fabricValidationSchemas = {
  createFabric: z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    type: z.enum(['Cotton', 'Silk', 'Wool', 'Synthetic', 'Blend']),
    status: z.enum(['Active', 'Inactive', 'Discontinued']).optional(),
    retailPrice: z.number().positive('Retail price must be positive'),
    wholesalePrice: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    stockQuantity: z.number().min(0, 'Stock quantity cannot be negative'),
    quantityUnit: z.string().optional(),
    reorderPoint: z.number().min(0).optional(),
    manufacturerName: z.string().optional(),
    collection: z.string().optional(),
    colorFamily: z.string().optional(),
    pattern: z.string().optional(),
    width: z.string().optional(),
    weight: z.string().optional(),
    composition: z.string().optional(),
    careInstructions: z.string().optional(),
    properties: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional(),
    swatchImageUrl: z.string().url().optional(),
    featured: z.boolean().optional(),
    createdBy: z.string().optional()
  }),

  updateFabric: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['Active', 'Inactive', 'Discontinued']).optional(),
    retailPrice: z.number().positive().optional(),
    wholesalePrice: z.number().positive().optional(),
    reorderPoint: z.number().min(0).optional(),
    manufacturerName: z.string().optional(),
    collection: z.string().optional(),
    colorFamily: z.string().optional(),
    pattern: z.string().optional(),
    width: z.string().optional(),
    weight: z.string().optional(),
    composition: z.string().optional(),
    careInstructions: z.string().optional(),
    properties: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional(),
    imageUrl: z.string().url().optional(),
    swatchImageUrl: z.string().url().optional(),
    featured: z.boolean().optional(),
    updatedBy: z.string().optional()
  }),

  updateStock: z.object({
    operation: z.enum(['add', 'subtract', 'set']),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().optional(),
    reason: z.string().optional(),
    updatedBy: z.string().optional()
  }),

  searchQuery: z.object({
    q: z.string().optional(),
    name: z.string().optional(),
    type: z.enum(['Cotton', 'Silk', 'Wool', 'Synthetic', 'Blend']).optional(),
    status: z.enum(['Active', 'Inactive', 'Discontinued']).optional(),
    manufacturerName: z.string().optional(),
    collection: z.string().optional(),
    colorFamily: z.string().optional(),
    pattern: z.string().optional(),
    featured: z.coerce.boolean().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    inStock: z.coerce.boolean().optional(),
    sortBy: z.enum(['name', 'sku', 'retailPrice', 'createdAt', 'updatedAt', 'stockQuantity', 'viewCount']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(100).optional()
  }),

  fabricId: z.object({
    id: z.string().uuid('Invalid fabric ID format')
  }),

  fabricSku: z.object({
    sku: z.string().min(1, 'SKU is required')
  })
};

export const commonValidationMiddleware = {
  createFabric: ValidationMiddleware.validate({
    body: fabricValidationSchemas.createFabric
  }),

  updateFabric: ValidationMiddleware.validate({
    body: fabricValidationSchemas.updateFabric,
    params: fabricValidationSchemas.fabricId
  }),

  updateStock: ValidationMiddleware.validate({
    body: fabricValidationSchemas.updateStock,
    params: fabricValidationSchemas.fabricId
  }),

  searchFabrics: ValidationMiddleware.validate({
    query: fabricValidationSchemas.searchQuery
  }),

  getFabricById: ValidationMiddleware.validate({
    params: fabricValidationSchemas.fabricId
  }),

  getFabricBySku: ValidationMiddleware.validate({
    params: fabricValidationSchemas.fabricSku
  })
};