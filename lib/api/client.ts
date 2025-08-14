/**
 * API Client Abstraction
 * This client can work with both Next.js API routes and external NestJS backend
 */

import { getSession } from "next-auth/react";

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class APIClient {
  private baseURL: string;
  private isExternal: boolean;

  constructor() {
    // Check if we're using an external API (NestJS) or internal Next.js API routes
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '';
    this.isExternal = !!process.env.NEXT_PUBLIC_API_URL;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Get authentication token
    const token = await this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async getAuthToken(): Promise<string | null> {
    if (this.isExternal) {
      // For NestJS backend, get JWT from localStorage or cookie
      if (typeof window !== 'undefined') {
        return localStorage.getItem('jwt_token') || this.getCookie('jwt_token');
      }
      return null;
    } else {
      // For Next.js, get session from NextAuth
      const session = await getSession();
      return session?.user ? 'nextauth-session' : null;
    }
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }

  private getFullURL(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    if (this.isExternal) {
      return `${this.baseURL}${cleanEndpoint}`;
    } else {
      // For internal Next.js API routes
      return `/api${cleanEndpoint}`;
    }
  }

  async get<T = any>(endpoint: string): Promise<APIResponse<T>> {
    try {
      const response = await fetch(this.getFullURL(endpoint), {
        method: 'GET',
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API GET Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async post<T = any>(endpoint: string, body?: any): Promise<APIResponse<T>> {
    try {
      const response = await fetch(this.getFullURL(endpoint), {
        method: 'POST',
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API POST Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async put<T = any>(endpoint: string, body?: any): Promise<APIResponse<T>> {
    try {
      const response = await fetch(this.getFullURL(endpoint), {
        method: 'PUT',
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API PUT Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async delete<T = any>(endpoint: string): Promise<APIResponse<T>> {
    try {
      const response = await fetch(this.getFullURL(endpoint), {
        method: 'DELETE',
        headers: await this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API DELETE Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async patch<T = any>(endpoint: string, body?: any): Promise<APIResponse<T>> {
    try {
      const response = await fetch(this.getFullURL(endpoint), {
        method: 'PATCH',
        headers: await this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API PATCH Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient();