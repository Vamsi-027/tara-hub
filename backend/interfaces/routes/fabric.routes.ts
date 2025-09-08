/**
 * Fabric Routes
 * Interface layer - defines HTTP routes for fabric operations
 * Single Responsibility: Route definition and middleware composition
 */

import { NextRequest, NextResponse } from 'next/server';
import { FabricController } from '../controllers/fabric.controller';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { commonValidationMiddleware } from '../middleware/validation.middleware';
import { HttpStatusCode } from '../../shared/constants/http-status.constants';
import { createErrorResponse } from '../../shared/utils/api-response.util';

type RouteHandler = (request: NextRequest, params?: any) => Promise<NextResponse>;
type Middleware = (request: AuthenticatedRequest, params?: any) => Promise<NextResponse | null>;

export class FabricRoutes {
  constructor(
    private readonly fabricController: FabricController,
    private readonly authMiddleware: AuthMiddleware
  ) {}

  private async applyMiddlewares(
    middlewares: Middleware[],
    request: AuthenticatedRequest,
    params?: any
  ): Promise<NextResponse | null> {
    for (const middleware of middlewares) {
      const result = await middleware(request, params);
      if (result) {
        return result;
      }
    }
    return null;
  }

  private createRoute(
    handler: (request: NextRequest, params?: any) => Promise<NextResponse>,
    middlewares: Middleware[] = []
  ): RouteHandler {
    return async (request: NextRequest, params?: any) => {
      try {
        const middlewareResult = await this.applyMiddlewares(
          middlewares,
          request as AuthenticatedRequest,
          params
        );
        
        if (middlewareResult) {
          return middlewareResult;
        }

        return await handler(request, params);
      } catch (error) {
        console.error('Route error:', error);
        return createErrorResponse(
          'Internal server error',
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
    };
  }

  // Public routes
  getFabricById(): RouteHandler {
    return this.createRoute(
      (req, params) => this.fabricController.getFabricById(req, params),
      [
        this.authMiddleware.optional(),
        commonValidationMiddleware.getFabricById
      ]
    );
  }

  getFabricBySku(): RouteHandler {
    return this.createRoute(
      (req, params) => this.fabricController.getFabricBySku(req, params),
      [
        this.authMiddleware.optional(),
        commonValidationMiddleware.getFabricBySku
      ]
    );
  }

  searchFabrics(): RouteHandler {
    return this.createRoute(
      (req) => this.fabricController.searchFabrics(req),
      [
        this.authMiddleware.optional(),
        commonValidationMiddleware.searchFabrics
      ]
    );
  }

  getFeaturedFabrics(): RouteHandler {
    return this.createRoute(
      (req) => this.fabricController.getFeaturedFabrics(req),
      [this.authMiddleware.optional()]
    );
  }

  // Admin routes
  createFabric(): RouteHandler {
    return this.createRoute(
      (req) => this.fabricController.createFabric(req),
      [
        this.authMiddleware.requireAdmin(),
        commonValidationMiddleware.createFabric
      ]
    );
  }

  updateFabric(): RouteHandler {
    return this.createRoute(
      (req, params) => this.fabricController.updateFabric(req, params),
      [
        this.authMiddleware.requireAdmin(),
        commonValidationMiddleware.updateFabric
      ]
    );
  }

  deleteFabric(): RouteHandler {
    return this.createRoute(
      (req, params) => this.fabricController.deleteFabric(req, params),
      [
        this.authMiddleware.requireAdmin(),
        commonValidationMiddleware.getFabricById
      ]
    );
  }

  updateStock(): RouteHandler {
    return this.createRoute(
      (req, params) => this.fabricController.updateStock(req, params),
      [
        this.authMiddleware.requireAdmin(),
        commonValidationMiddleware.updateStock
      ]
    );
  }

  // Route configuration for Next.js App Router
  getRouteConfig() {
    return {
      // GET routes
      'GET /api/v1/fabrics': this.searchFabrics(),
      'GET /api/v1/fabrics/featured': this.getFeaturedFabrics(),
      'GET /api/v1/fabrics/[id]': this.getFabricById(),
      'GET /api/v1/fabrics/sku/[sku]': this.getFabricBySku(),

      // POST routes (Admin only)
      'POST /api/v1/fabrics': this.createFabric(),
      'POST /api/v1/fabrics/[id]/stock': this.updateStock(),

      // PUT routes (Admin only)
      'PUT /api/v1/fabrics/[id]': this.updateFabric(),

      // DELETE routes (Admin only)
      'DELETE /api/v1/fabrics/[id]': this.deleteFabric()
    };
  }
}

export function createFabricRoutes(
  fabricController: FabricController,
  authMiddleware: AuthMiddleware
): FabricRoutes {
  return new FabricRoutes(fabricController, authMiddleware);
}