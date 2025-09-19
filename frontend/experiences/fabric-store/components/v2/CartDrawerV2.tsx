'use client'

import { useState, useRef } from 'react'
import { X, Plus, Minus, Trash2, Heart, ShoppingBag, CreditCard, Tag, Gift } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface CartItem {
  id: string
  title: string
  variant: string
  price: number
  quantity: number
  thumbnail: string
  type: 'fabric' | 'swatch' | 'shipping'
}

interface CartDrawerV2Props {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onSaveForLater?: (id: string) => void
  className?: string
}

export function CartDrawerV2({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onSaveForLater,
  className = ''
}: CartDrawerV2Props) {
  const [orderNotes, setOrderNotes] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discount = promoApplied ? subtotal * 0.1 : 0 // 10% discount for demo
  const shipping = subtotal > 5000 ? 0 : 699 // Free shipping over $50
  const tax = (subtotal - discount + shipping) * 0.08 // 8% tax
  const total = subtotal - discount + shipping + tax

  const handlePromoCode = () => {
    if (promoCode.toLowerCase() === 'save10') {
      setPromoApplied(true)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          ${className}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Shopping Cart ({items.length})
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">Add some beautiful fabrics to get started</p>
                <Button onClick={onClose}>Continue Shopping</Button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.thumbnail && (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 line-clamp-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.variant}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-semibold text-gray-900">
                          {formatPrice(item.price)}
                        </span>
                        {item.type === 'swatch' && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                            Sample
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          className="w-6 h-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        {onSaveForLater && item.type !== 'shipping' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSaveForLater(item.id)}
                            className="w-6 h-6 p-0"
                            title="Save for later"
                          >
                            <Heart className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          className="w-6 h-6 p-0 text-red-600 hover:text-red-700"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Order Notes */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Special instructions, delivery preferences, etc."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                  />
                </div>

                {/* Promo Code */}
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      disabled={promoApplied}
                    />
                    <Button
                      variant="outline"
                      onClick={handlePromoCode}
                      disabled={promoApplied || !promoCode}
                      className="gap-1"
                    >
                      <Tag className="w-4 h-4" />
                      Apply
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      Promo code applied!
                    </p>
                  )}
                  {!promoApplied && (
                    <p className="text-gray-500 text-xs mt-1">
                      Try "SAVE10" for 10% off
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t bg-white p-6">
              {/* Order Summary */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-green-600">-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Buttons */}
              <div className="space-y-3">
                <Button className="w-full gap-2" size="lg">
                  <CreditCard className="w-4 h-4" />
                  Proceed to Checkout
                </Button>
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Continue Shopping
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-4 flex justify-center items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  🔒 Secure Checkout
                </span>
                <span className="flex items-center gap-1">
                  📞 24/7 Support
                </span>
                <span className="flex items-center gap-1">
                  🚚 Free Returns
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}