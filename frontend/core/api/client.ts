/**
 * Unified API Client for all frontend applications
 * Follows DRY principle - single source of truth for API communication
 */

import { Result } from '../patterns/result';

// API configuration
export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

// Request options
export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, any>;
  body?: any;
  timeout?: number;
}

// Response wrapper
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

// API error
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Base API client
export class ApiClient {
  private config: ApiConfig;
  private abortControllers = new Map<string, AbortController>();

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 30000,
      credentials: 'include',
      ...config
    };
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options.params);
    const requestId = `${options.method || 'GET'}_${endpoint}_${Date.now()}`;
    
    // Create abort controller
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);

    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, options.timeout || this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
        credentials: options.credentials || this.config.credentials
      });

      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      if (!response.ok) {
        const error = await this.parseError(response);
        throw new ApiError(error.message, response.status, error.data);
      }

      const data = await this.parseResponse<T>(response);

      return {
        data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw new ApiError(error.message, 0);
      }

      throw new ApiError('Unknown error occurred', 0);
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    });
    return response.data;
  }

  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body
    });
    return response.data;
  }

  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body
    });
    return response.data;
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body
    });
    return response.data;
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const response = await this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    });
    return response.data;
  }

  // Cancel a request
  cancel(endpoint: string, method: string = 'GET'): void {
    const controllers = Array.from(this.abortControllers.entries())
      .filter(([key]) => key.startsWith(`${method}_${endpoint}`));
    
    controllers.forEach(([key, controller]) => {
      controller.abort();
      this.abortControllers.delete(key);
    });
  }

  // Cancel all requests
  cancelAll(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  // Helper methods
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.config.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    
    if (contentType?.includes('text/')) {
      return response.text() as any;
    }
    
    return response.blob() as any;
  }

  private async parseError(response: Response): Promise<{ message: string; data?: any }> {
    try {
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const error = await response.json();
        return {
          message: error.message || error.error || `HTTP ${response.status}`,
          data: error
        };
      }
      
      const text = await response.text();
      return {
        message: text || `HTTP ${response.status}`,
        data: text
      };
    } catch {
      return {
        message: `HTTP ${response.status}`,
        data: null
      };
    }
  }
}

// Singleton instances for different API endpoints
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api'
});

export const adminApiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_ADMIN_API_URL || '/api/v1'
});

export const medusaApiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_URL || 'http://localhost:9000'
});

// Typed API client for specific endpoints
export class TypedApiClient<T> {
  constructor(
    private client: ApiClient,
    private basePath: string
  ) {}

  async list(options?: RequestOptions): Promise<T[]> {
    return this.client.get<T[]>(this.basePath, options);
  }

  async get(id: string, options?: RequestOptions): Promise<T> {
    return this.client.get<T>(`${this.basePath}/${id}`, options);
  }

  async create(data: Omit<T, 'id'>, options?: RequestOptions): Promise<T> {
    return this.client.post<T>(this.basePath, data, options);
  }

  async update(id: string, data: Partial<T>, options?: RequestOptions): Promise<T> {
    return this.client.put<T>(`${this.basePath}/${id}`, data, options);
  }

  async patch(id: string, data: Partial<T>, options?: RequestOptions): Promise<T> {
    return this.client.patch<T>(`${this.basePath}/${id}`, data, options);
  }

  async delete(id: string, options?: RequestOptions): Promise<void> {
    return this.client.delete<void>(`${this.basePath}/${id}`, options);
  }
}