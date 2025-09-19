import { isNewCheckoutEnabled } from './feature-flags'
import * as cartApi from './services/cart-api.service'

export interface CartItem {
  id: string
  variantId: string
  productId: string
  title: string
  variant: string
  price: number
  quantity: number
  thumbnail?: string
  type?: 'swatch' | 'fabric'
  yardage?: number
}

export async function addToCart(item: Omit<CartItem, 'id'>) {
  // TEMPORARILY DISABLED - Force use localStorage until Medusa cart is fixed
  // Use new checkout flow if enabled
  // if (isNewCheckoutEnabled()) {
  //   try {
  //     const cart = await cartApi.addToCart({
  //       variant_id: item.variantId,
  //       quantity: item.quantity,
  //       metadata: {
  //         type: item.type,
  //         yardage: item.yardage,
  //         title: item.title,
  //         thumbnail: item.thumbnail,
  //       },
  //     })
  //     return cart.items
  //   } catch (error) {
  //     console.error('Failed to add to cart:', error)
  //     throw error
  //   }
  // }

  // Legacy LocalStorage implementation
  // Ensure we're in browser environment
  if (typeof window === 'undefined') {
    console.warn('addToCart called outside browser environment')
    return []
  }

  // Create a stable ID based on product and variant, not timestamp
  const stableId = `${item.type || 'fabric'}-${item.productId}-${item.variantId}`

  // Debug logging
  console.log('Adding item to cart:', { item, stableId })

  // Get existing cart
  const existingCart = localStorage.getItem('fabric-cart')
  const cart: CartItem[] = existingCart ? JSON.parse(existingCart) : []
  console.log('Existing cart:', cart)

  // Check if this exact item already exists in cart
  const existingItemIndex = cart.findIndex((cartItem) =>
    cartItem.productId === item.productId &&
    cartItem.variantId === item.variantId &&
    cartItem.type === item.type
  )

  if (existingItemIndex > -1) {
    // Update existing item
    if (item.type === 'fabric' && item.yardage) {
      // For fabric, add to yardage
      cart[existingItemIndex].yardage = (cart[existingItemIndex].yardage || 0) + item.yardage
    } else {
      // For other items, update quantity
      cart[existingItemIndex].quantity += item.quantity
    }
  } else {
    // Add new item with stable ID
    const newItem: CartItem = {
      ...item,
      id: stableId
    }
    cart.push(newItem)
  }

  // Save to localStorage
  localStorage.setItem('fabric-cart', JSON.stringify(cart))
  console.log('Cart saved to localStorage:', cart)

  // Verify save
  const verifyCart = localStorage.getItem('fabric-cart')
  console.log('Verified cart in localStorage:', verifyCart)

  // Dispatch custom event for cart update with action type
  window.dispatchEvent(new CustomEvent('cart-updated', {
    detail: {
      cart,
      action: 'add',
      item: existingItemIndex > -1 ? cart[existingItemIndex] : cart[cart.length - 1]
    }
  }))

  return cart
}

export async function getCart(): Promise<CartItem[]> {
  // TEMPORARILY DISABLED - Force use localStorage until Medusa cart is fixed
  // Use new checkout flow if enabled
  // if (isNewCheckoutEnabled()) {
  //   try {
  //     const cart = await cartApi.getCart()
  //     // Transform Medusa cart items to legacy format
  //     return cart.items.map(item => ({
  //       id: item.id,
  //       variantId: item.variant_id,
  //       productId: item.product_id,
  //       title: item.title,
  //       variant: item.metadata?.variant || '',
  //       price: item.unit_price,
  //       quantity: item.quantity,
  //       thumbnail: item.thumbnail,
  //       type: item.metadata?.type,
  //       yardage: item.metadata?.yardage,
  //     }))
  //   } catch (error) {
  //     console.error('Failed to get cart:', error)
  //     return []
  //   }
  // }

  // Legacy LocalStorage implementation
  const existingCart = localStorage.getItem('fabric-cart')
  return existingCart ? JSON.parse(existingCart) : []
}

export async function updateCartItemQuantity(id: string, quantity: number) {
  // TEMPORARILY DISABLED - Force use localStorage until Medusa cart is fixed
  // if (isNewCheckoutEnabled()) {
  //   try {
  //     const cart = await cartApi.updateCartItem(id, quantity)
  //     return cart.items
  //   } catch (error) {
  //     console.error('Failed to update cart item:', error)
  //     throw error
  //   }
  // }

  // Legacy LocalStorage implementation
  const cart = getCart()
  const itemIndex = cart.findIndex(item => item.id === id)

  if (itemIndex > -1) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.splice(itemIndex, 1)
    } else {
      cart[itemIndex].quantity = quantity
    }

    localStorage.setItem('fabric-cart', JSON.stringify(cart))
    window.dispatchEvent(new CustomEvent('cart-updated', {
      detail: {
        cart,
        action: 'update',
        item: cart[itemIndex]
      }
    }))
  }

  return cart
}

export async function removeFromCart(id: string) {
  // TEMPORARILY DISABLED - Force use localStorage until Medusa cart is fixed
  // if (isNewCheckoutEnabled()) {
  //   try {
  //     const cart = await cartApi.removeFromCart(id)
  //     return cart.items
  //   } catch (error) {
  //     console.error('Failed to remove from cart:', error)
  //     throw error
  //   }
  // }

  // Legacy LocalStorage implementation
  const cart = getCart()
  const updatedCart = cart.filter(item => item.id !== id)

  localStorage.setItem('fabric-cart', JSON.stringify(updatedCart))
  window.dispatchEvent(new CustomEvent('cart-updated', {
    detail: {
      cart: updatedCart,
      action: 'remove'
    }
  }))

  return updatedCart
}

export async function clearCart() {
  // TEMPORARILY DISABLED - Force use localStorage until Medusa cart is fixed
  // if (isNewCheckoutEnabled()) {
  //   try {
  //     // Create new cart to clear the old one
  //     await cartApi.createCart()
  //     return []
  //   } catch (error) {
  //     console.error('Failed to clear cart:', error)
  //     throw error
  //   }
  // }

  // Legacy LocalStorage implementation
  localStorage.setItem('fabric-cart', JSON.stringify([]))
  window.dispatchEvent(new CustomEvent('cart-updated', {
    detail: {
      cart: [],
      action: 'clear'
    }
  }))
  return []
}