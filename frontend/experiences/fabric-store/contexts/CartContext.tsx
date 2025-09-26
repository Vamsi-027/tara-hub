"use client"
import React, { createContext, useContext, useEffect, useState } from 'react'
import Medusa from '@medusajs/js-sdk'

interface CartItem {
  variant_id: string
  quantity: number
  metadata?: Record<string, any>
}

interface CartContextType {
  cart: any | null
  loading: boolean
  error: string | null
  addItem: (item: CartItem) => Promise<void>
  updateItem: (lineItemId: string, quantity: number) => Promise<void>
  removeItem: (lineItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// Local no-op notification helper to avoid runtime errors if not wired
const showNotification = (_msg: string, _type: 'success' | 'error' | 'info') => {}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const medusa = new Medusa({
    baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!,
    publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  })

  useEffect(() => {
    initializeCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initializeCart = async () => {
    try {
      setLoading(true)
      const cartId = typeof window !== 'undefined' ? localStorage.getItem('medusa_cart_id') : null

      if (cartId) {
        try {
          const existingCart = await medusa.store.cart.retrieve(cartId)
          if (existingCart && (existingCart as any).cart) {
            setCart((existingCart as any).cart)
            setLoading(false)
            return
          }
        } catch {
          if (typeof window !== 'undefined') localStorage.removeItem('medusa_cart_id')
        }
      }

      const { cart: newCart } = await medusa.store.cart.create({
        region_id: process.env.NEXT_PUBLIC_REGION_ID || 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ',
        metadata: { source: 'fabric-store', created_via: 'web' },
      })
      setCart(newCart)
      if (typeof window !== 'undefined') localStorage.setItem('medusa_cart_id', newCart.id)
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize cart')
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (item: CartItem) => {
    if (!cart) {
      await initializeCart()
      if (!cart) throw new Error('Failed to initialize cart')
    }

    try {
      setLoading(true)
      const existingItem = cart.items?.find((i: any) => i.variant_id === item.variant_id)

      if (existingItem) {
        const { cart: updatedCart } = await medusa.store.cart.updateLineItem(cart.id, existingItem.id, {
          quantity: existingItem.quantity + item.quantity,
        })
        setCart(updatedCart)
      } else {
        const { cart: updatedCart } = await medusa.store.cart.createLineItem(cart.id, {
          variant_id: item.variant_id,
          quantity: item.quantity,
          metadata: item.metadata,
        })
        setCart(updatedCart)
      }

      showNotification('Item added to cart', 'success')
    } catch (err: any) {
      setError(err?.message || 'Failed to add item')
      showNotification('Failed to add item to cart', 'error')
    } finally {
      setLoading(false)
    }
  }

  const updateItem = async (lineItemId: string, quantity: number) => {
    if (!cart) return
    try {
      setLoading(true)
      if (quantity === 0) {
        await removeItem(lineItemId)
        return
      }
      const { cart: updatedCart } = await medusa.store.cart.updateLineItem(cart.id, lineItemId, { quantity })
      setCart(updatedCart)
    } catch (err: any) {
      setError(err?.message || 'Failed to update item')
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (lineItemId: string) => {
    if (!cart) return
    try {
      setLoading(true)
      const { cart: updatedCart } = await medusa.store.cart.deleteLineItem(cart.id, lineItemId)
      setCart(updatedCart)
      showNotification('Item removed from cart', 'info')
    } catch (err: any) {
      setError(err?.message || 'Failed to remove item')
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    if (typeof window !== 'undefined') localStorage.removeItem('medusa_cart_id')
    setCart(null)
    await initializeCart()
  }

  const refreshCart = async () => {
    if (!cart) return
    try {
      const { cart: refreshedCart } = await medusa.store.cart.retrieve(cart.id)
      setCart(refreshedCart)
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh cart')
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, loading, error, addItem, updateItem, removeItem, clearCart, refreshCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
