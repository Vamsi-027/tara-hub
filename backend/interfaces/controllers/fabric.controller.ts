/**
 * Fabric Controller
 * Interface layer - handles HTTP requests and responses
 * Single Responsibility: HTTP request/response handling for fabric operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { CreateFabricUseCase } from '../../application/use-cases/fabric/create-fabric.use-case';
import { UpdateFabricUseCase } from '../../application/use-cases/fabric/update-fabric.use-case';
import { DeleteFabricUseCase } from '../../application/use-cases/fabric/delete-fabric.use-case';
import { GetFabricUseCase } from '../../application/use-cases/fabric/get-fabric.use-case';
import { SearchFabricsUseCase } from '../../application/use-cases/fabric/search-fabrics.use-case';
import { ManageInventoryUseCase } from '../../application/use-cases/fabric/manage-inventory.use-case';
import { CreateFabricCommand } from '../../application/commands/fabric/create-fabric.command';
import { UpdateFabricCommand } from '../../application/commands/fabric/update-fabric.command';
import { DeleteFabricCommand } from '../../application/commands/fabric/delete-fabric.command';
import { GetFabricQuery } from '../../application/queries/fabric/get-fabric.query';
import { SearchFabricsQuery } from '../../application/queries/fabric/search-fabrics.query';
import { UpdateStockCommand } from '../../application/commands/fabric/update-stock.command';
import { FabricMapper } from '../../application/mappers/fabric.mapper';
import { FabricId } from '../../domain/value-objects/fabric-id.vo';
import { SKU } from '../../domain/value-objects/sku.vo';
import { HttpStatusCode } from '../../shared/constants/http-status.constants';
import { ApiResponse, createErrorResponse, createSuccessResponse } from '../../shared/utils/api-response.util';

export class FabricController {
  constructor(
    private readonly createFabricUseCase: CreateFabricUseCase,
    private readonly updateFabricUseCase: UpdateFabricUseCase,
    private readonly deleteFabricUseCase: DeleteFabricUseCase,
    private readonly getFabricUseCase: GetFabricUseCase,
    private readonly searchFabricsUseCase: SearchFabricsUseCase,
    private readonly manageInventoryUseCase: ManageInventoryUseCase,
    private readonly fabricMapper: FabricMapper
  ) {}

  async createFabric(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const command = CreateFabricCommand.fromJson(body);
      
      const result = await this.createFabricUseCase.execute(command);
      
      if (result.isFailure()) {
        return createErrorResponse(
          result.error,
          HttpStatusCode.BAD_REQUEST
        );
      }

      const response = await this.fabricMapper.toDetailResponse(result.value!);
      
      return createSuccessResponse(
        response,
        HttpStatusCode.CREATED,
        'Fabric created successfully'
      );
    } catch (error) {
      return createErrorResponse(
        'Invalid request data',
        HttpStatusCode.BAD_REQUEST
      );
    }
  }

  async updateFabric(request: NextRequest, params: { id: string }): Promise<NextResponse> {
    try {
      const fabricId = FabricId.create(params.id);
      const body = await request.json();
      const command = UpdateFabricCommand.fromJson({ id: fabricId.value, ...body });
      
      const result = await this.updateFabricUseCase.execute(command);
      
      if (result.isFailure()) {
        if (result.error.includes('not found')) {
          return createErrorResponse(result.error, HttpStatusCode.NOT_FOUND);
        }
        return createErrorResponse(result.error, HttpStatusCode.BAD_REQUEST);
      }

      const response = await this.fabricMapper.toDetailResponse(result.value!);
      
      return createSuccessResponse(
        response,
        HttpStatusCode.OK,
        'Fabric updated successfully'
      );
    } catch (error) {
      return createErrorResponse(
        'Invalid request data',
        HttpStatusCode.BAD_REQUEST
      );
    }
  }

  async deleteFabric(request: NextRequest, params: { id: string }): Promise<NextResponse> {
    try {
      const fabricId = FabricId.create(params.id);
      const command = new DeleteFabricCommand(fabricId);
      
      const result = await this.deleteFabricUseCase.execute(command);
      
      if (result.isFailure()) {
        if (result.error.includes('not found')) {
          return createErrorResponse(result.error, HttpStatusCode.NOT_FOUND);
        }
        return createErrorResponse(result.error, HttpStatusCode.BAD_REQUEST);
      }

      return createSuccessResponse(
        null,
        HttpStatusCode.NO_CONTENT,
        'Fabric deleted successfully'
      );
    } catch (error) {
      return createErrorResponse(
        'Invalid fabric ID',
        HttpStatusCode.BAD_REQUEST
      );
    }
  }

  async getFabricById(request: NextRequest, params: { id: string }): Promise<NextResponse> {
    try {
      const fabricId = FabricId.create(params.id);
      const query = new GetFabricQuery(fabricId);
      
      const result = await this.getFabricUseCase.execute(query);
      
      if (result.isFailure()) {
        return createErrorResponse(result.error, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      if (!result.value) {
        return createErrorResponse('Fabric not found', HttpStatusCode.NOT_FOUND);
      }

      const response = await this.fabricMapper.toDetailResponse(result.value);
      
      return createSuccessResponse(response, HttpStatusCode.OK);
    } catch (error) {
      return createErrorResponse(
        'Invalid fabric ID',
        HttpStatusCode.BAD_REQUEST
      );
    }
  }

  async getFabricBySku(request: NextRequest, params: { sku: string }): Promise<NextResponse> {
    try {
      const sku = SKU.create(params.sku);
      const query = new GetFabricQuery(undefined, sku);
      
      const result = await this.getFabricUseCase.execute(query);
      
      if (result.isFailure()) {
        return createErrorResponse(result.error, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      if (!result.value) {
        return createErrorResponse('Fabric not found', HttpStatusCode.NOT_FOUND);
      }

      const response = await this.fabricMapper.toDetailResponse(result.value);
      
      return createSuccessResponse(response, HttpStatusCode.OK);
    } catch (error) {
      return createErrorResponse(
        'Invalid SKU',
        HttpStatusCode.BAD_REQUEST
      );
    }
  }

  async searchFabrics(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const query = SearchFabricsQuery.fromSearchParams(searchParams);
      
      const result = await this.searchFabricsUseCase.execute(query);
      
      if (result.isFailure()) {
        return createErrorResponse(result.error, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      const fabrics = await this.fabricMapper.toListResponses(result.value!.data);
      
      const response = {
        data: fabrics,
        total: result.value!.total,
        page: result.value!.page,
        limit: result.value!.limit,
        totalPages: result.value!.totalPages,
        hasNext: result.value!.hasNext,
        hasPrevious: result.value!.hasPrevious
      };
      
      return createSuccessResponse(response, HttpStatusCode.OK);
    } catch (error) {
      return createErrorResponse(
        'Invalid search parameters',
        HttpStatusCode.BAD_REQUEST
      );
    }
  }

  async updateStock(request: NextRequest, params: { id: string }): Promise<NextResponse> {
    try {
      const fabricId = FabricId.create(params.id);
      const body = await request.json();
      
      const command = new UpdateStockCommand(
        fabricId,
        body.operation,
        body.quantity,
        body.unit || 'yards',
        body.reason,
        body.updatedBy
      );
      
      const result = await this.manageInventoryUseCase.updateStock(command);
      
      if (result.isFailure()) {
        if (result.error.includes('not found')) {
          return createErrorResponse(result.error, HttpStatusCode.NOT_FOUND);
        }
        return createErrorResponse(result.error, HttpStatusCode.BAD_REQUEST);
      }

      const response = await this.fabricMapper.toDetailResponse(result.value!);
      
      return createSuccessResponse(
        response,
        HttpStatusCode.OK,
        'Stock updated successfully'
      );
    } catch (error) {
      return createErrorResponse(
        'Invalid request data',
        HttpStatusCode.BAD_REQUEST
      );
    }
  }

  async getFeaturedFabrics(request: NextRequest): Promise<NextResponse> {
    try {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      
      const query = new SearchFabricsQuery({
        featured: true
      }, {
        field: 'updatedAt',
        direction: 'desc'
      }, {
        page: 1,
        limit: Math.min(limit, 50)
      });
      
      const result = await this.searchFabricsUseCase.execute(query);
      
      if (result.isFailure()) {
        return createErrorResponse(result.error, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      const fabrics = await this.fabricMapper.toListResponses(result.value!.data);
      
      return createSuccessResponse(fabrics, HttpStatusCode.OK);
    } catch (error) {
      return createErrorResponse(
        'Invalid request parameters',
        HttpStatusCode.BAD_REQUEST
      );
    }
  }
}