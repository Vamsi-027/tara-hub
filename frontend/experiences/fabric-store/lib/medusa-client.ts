/**
 * Medusa Commerce Client for Fabric Store
 * Connects to the main app's commerce API bridge
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePerYard: number;
  color: string;
  pattern: string;
  width: number;
  weight: number;
  composition: any[];
  imageUrl: string;
  images: string[];
  inStock: boolean;
  availableQuantity: number;
  sku: string;
  sampleAvailable: boolean;
  samplePrice: number;
  sampleSize: string;
  careInstructions: string[];
  certifications: string[];
  tags: string[];
  performanceRating: any;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  isSample: boolean;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
}

export class MedusaClient {
  private baseUrl: string;
  private cartId: string | null = null;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/commerce`;
    this.loadCartId();
  }

  private loadCartId() {
    if (typeof window !== 'undefined') {
      this.cartId = localStorage.getItem('medusa_cart_id');
    }
  }

  private saveCartId(cartId: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('medusa_cart_id', cartId);
      this.cartId = cartId;
    }
  }

  /**
   * Fetch products with filters
   */
  async getProducts(options: {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
    fabricType?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}): Promise<{
    products: Product[];
    count: number;
    limit: number;
    offset: number;
  }> {
    const searchParams = new URLSearchParams();
    
    if (options.limit) searchParams.append('limit', options.limit.toString());
    if (options.offset) searchParams.append('offset', options.offset.toString());
    if (options.category) searchParams.append('category', options.category);
    if (options.search) searchParams.append('search', options.search);
    if (options.fabricType) searchParams.append('fabric_type', options.fabricType);
    if (options.minPrice) searchParams.append('min_price', options.minPrice.toString());
    if (options.maxPrice) searchParams.append('max_price', options.maxPrice.toString());

    const response = await fetch(`${this.baseUrl}/products?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get single product by ID
   */
  async getProduct(id: string): Promise<Product | null> {
    const response = await fetch(`${this.baseUrl}/products/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const data = await response.json();
    return data.product;
  }

  /**
   * Create or get existing cart
   */
  async getCart(): Promise<Cart | null> {
    if (this.cartId) {
      try {
        const response = await fetch(`${this.baseUrl}/cart?cartId=${this.cartId}`);
        if (response.ok) {
          const data = await response.json();
          return this.transformCart(data.cart);
        }
      } catch (error) {
        console.error('Error fetching existing cart:', error);
      }
    }

    // Create new cart if none exists
    return this.createCart();
  }

  /**
   * Create a new cart
   */
  async createCart(): Promise<Cart> {
    const response = await fetch(`${this.baseUrl}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'sample', // For fabric samples
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create cart: ${response.statusText}`);
    }

    const data = await response.json();
    this.saveCartId(data.cartId);
    
    return this.transformCart(data.cart);
  }

  /**
   * Add item to cart
   */
  async addToCart(productId: string, quantity: number = 1, isSample: boolean = false): Promise<Cart> {
    if (!this.cartId) {
      await this.createCart();
    }

    const response = await fetch(`${this.baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cartId: this.cartId,
        productId,
        quantity,
        isSample,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add item to cart: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformCart(data.cart);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    if (!this.cartId) {
      throw new Error('No cart available');
    }

    const response = await fetch(`${this.baseUrl}/cart/items`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cartId: this.cartId,
        itemId,
        quantity,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update cart item: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformCart(data.cart);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: string): Promise<Cart> {
    if (!this.cartId) {
      throw new Error('No cart available');
    }

    const response = await fetch(
      `${this.baseUrl}/cart/items?cartId=${this.cartId}&itemId=${itemId}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to remove item from cart: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformCart(data.cart);
  }

  /**
   * Transform Medusa cart to our cart format
   */
  private transformCart(medusaCart: any): Cart {
    return {
      id: medusaCart.id,
      items: medusaCart.items?.map((item: any) => ({
        id: item.id,
        productId: item.variant_id || item.product_id,
        quantity: item.quantity,
        isSample: item.metadata?.is_sample || false,
        product: {
          id: item.product?.id || item.variant_id,
          name: item.title,
          description: item.description,
          pricePerYard: parseFloat(item.unit_price || 0),
          imageUrl: item.thumbnail,
          samplePrice: parseFloat(item.unit_price || 0),
        } as Product,
      })) || [],
      subtotal: parseFloat(medusaCart.subtotal || 0),
      total: parseFloat(medusaCart.total || 0),
      itemCount: medusaCart.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
    };
  }

  /**
   * Clear cart from local storage
   */
  clearCart() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medusa_cart_id');
      this.cartId = null;
    }
  }
}

// Export singleton instance
export const medusaClient = new MedusaClient();