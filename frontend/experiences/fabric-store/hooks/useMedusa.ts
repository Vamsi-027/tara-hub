/**
 * React hooks for Medusa commerce integration
 */

import { useState, useEffect } from 'react';
import { medusaClient, Product, Cart } from '../lib/medusa-client';

/**
 * Hook for fetching products
 */
export function useProducts(options: {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  fabricType?: string;
  minPrice?: number;
  maxPrice?: number;
} = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await medusaClient.getProducts(options);
        
        if (mounted) {
          setProducts(data.products);
          setCount(data.count);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch products');
          console.error('Error fetching products:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [
    options.limit,
    options.offset,
    options.category,
    options.search,
    options.fabricType,
    options.minPrice,
    options.maxPrice,
  ]);

  return { products, loading, error, count };
}

/**
 * Hook for single product
 */
export function useProduct(productId: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }

    let mounted = true;

    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await medusaClient.getProduct(productId!);
        
        if (mounted) {
          setProduct(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch product');
          console.error('Error fetching product:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      mounted = false;
    };
  }, [productId]);

  return { product, loading, error };
}

/**
 * Hook for cart management
 */
export function useCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const cartData = await medusaClient.getCart();
      setCart(cartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cart');
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1, isSample: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedCart = await medusaClient.addToCart(productId, quantity, isSample);
      setCart(updatedCart);
      
      return updatedCart;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add to cart';
      setError(errorMsg);
      console.error('Error adding to cart:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedCart = await medusaClient.updateCartItem(itemId, quantity);
      setCart(updatedCart);
      
      return updatedCart;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update cart item';
      setError(errorMsg);
      console.error('Error updating cart item:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedCart = await medusaClient.removeFromCart(itemId);
      setCart(updatedCart);
      
      return updatedCart;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove from cart';
      setError(errorMsg);
      console.error('Error removing from cart:', err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    medusaClient.clearCart();
    setCart(null);
  };

  return {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refetch: fetchCart,
  };
}

/**
 * Combined hook for fabric store functionality
 */
export function useFabricStore() {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { cart, loading: cartLoading, addToCart, removeFromCart, clearCart } = useCart();

  // Transform products to legacy fabric format for compatibility
  const fabrics = products.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    pricePerYard: product.pricePerYard,
    color: product.color,
    pattern: product.pattern,
    width: product.width,
    weight: product.weight,
    composition: product.composition,
    imageUrl: product.imageUrl,
    images: product.images,
    inStock: product.inStock,
    availableQuantity: product.availableQuantity,
    sku: product.sku,
    sampleAvailable: product.sampleAvailable,
    samplePrice: product.samplePrice,
    sampleSize: product.sampleSize,
    careInstructions: product.careInstructions,
    certifications: product.certifications,
    tags: product.tags,
    performanceRating: product.performanceRating,
  }));

  return {
    fabrics,
    cart,
    loading: productsLoading || cartLoading,
    error: productsError,
    addToCart: (productId: string, isSample: boolean = true) => 
      addToCart(productId, 1, isSample),
    removeFromCart,
    clearCart,
  };
}