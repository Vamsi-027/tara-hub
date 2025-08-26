/**
 * API Response Utilities
 * Shared layer - standardized API response formatting
 * Single Responsibility: Consistent API response structure
 */

import { NextResponse } from 'next/server';
import { HttpStatusCode, HttpStatusCodeType } from '../constants/http-status.constants';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  statusCode: number;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function createSuccessResponse<T>(
  data: T,
  statusCode: HttpStatusCodeType = HttpStatusCode.OK,
  message?: string
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    statusCode
  };

  return NextResponse.json(response, { status: statusCode });
}

export function createErrorResponse(
  error: string,
  statusCode: HttpStatusCodeType = HttpStatusCode.INTERNAL_SERVER_ERROR,
  data?: any
): NextResponse {
  const response: ApiResponse = {
    success: false,
    data,
    error,
    timestamp: new Date().toISOString(),
    statusCode
  };

  return NextResponse.json(response, { status: statusCode });
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  },
  statusCode: HttpStatusCodeType = HttpStatusCode.OK,
  message?: string
): NextResponse {
  const response: PaginatedApiResponse<T> = {
    success: true,
    data,
    pagination,
    message,
    timestamp: new Date().toISOString(),
    statusCode
  };

  return NextResponse.json(response, { status: statusCode });
}

export function createValidationErrorResponse(
  errors: Record<string, string[]>,
  message: string = 'Validation failed'
): NextResponse {
  const response: ApiResponse = {
    success: false,
    data: { errors },
    error: message,
    timestamp: new Date().toISOString(),
    statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY
  };

  return NextResponse.json(response, { status: HttpStatusCode.UNPROCESSABLE_ENTITY });
}