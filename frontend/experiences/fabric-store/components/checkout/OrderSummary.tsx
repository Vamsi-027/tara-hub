import React from 'react'

export function OrderSummary({ cart }: { cart: any }) {
  if (!cart) return null

  const subtotal = cart.subtotal || 0
  const shipping = cart.shipping_total || 0
  const tax = cart.tax_total || 0
  const total = cart.total || subtotal + shipping + tax

  return (
    <aside className="border rounded-md p-4 sticky top-4">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
      <div className="space-y-2 mb-4">
        {cart.items?.map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.title} × {item.quantity}
            </span>
            <span>{(item.total / 100).toLocaleString(undefined, { style: 'currency', currency: cart.currency_code?.toUpperCase?.() || 'USD' })}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{(subtotal / 100).toLocaleString(undefined, { style: 'currency', currency: cart.currency_code?.toUpperCase?.() || 'USD' })}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{(shipping / 100).toLocaleString(undefined, { style: 'currency', currency: cart.currency_code?.toUpperCase?.() || 'USD' })}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{(tax / 100).toLocaleString(undefined, { style: 'currency', currency: cart.currency_code?.toUpperCase?.() || 'USD' })}</span>
        </div>
        <div className="flex justify-between font-semibold pt-2 border-t mt-2">
          <span>Total</span>
          <span>{(total / 100).toLocaleString(undefined, { style: 'currency', currency: cart.currency_code?.toUpperCase?.() || 'USD' })}</span>
        </div>
      </div>
    </aside>
  )
}

