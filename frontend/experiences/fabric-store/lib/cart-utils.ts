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

export function addToCart(item: Omit<CartItem, 'id'>) {
  // Create a stable ID based on product and variant, not timestamp
  const stableId = `${item.type || 'fabric'}-${item.productId}-${item.variantId}`

  // Get existing cart
  const existingCart = localStorage.getItem('fabric-cart')
  const cart: CartItem[] = existingCart ? JSON.parse(existingCart) : []

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

export function getCart(): CartItem[] {
  const existingCart = localStorage.getItem('fabric-cart')
  return existingCart ? JSON.parse(existingCart) : []
}

export function updateCartItemQuantity(id: string, quantity: number) {
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

export function removeFromCart(id: string) {
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

export function clearCart() {
  localStorage.setItem('fabric-cart', JSON.stringify([]))
  window.dispatchEvent(new CustomEvent('cart-updated', {
    detail: {
      cart: [],
      action: 'clear'
    }
  }))
  return []
}