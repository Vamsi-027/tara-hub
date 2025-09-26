import React, { useEffect, useState } from 'react'
import Medusa from '@medusajs/js-sdk'

export function ShippingMethodSelector({ cartId, onSubmit }: { cartId?: string, onSubmit: (optionId: string) => Promise<void> }) {
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string>('')

  useEffect(() => {
    if (!cartId) return
    const medusa = new Medusa({
      baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!,
      publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    })
    medusa.store.fulfillment
      .listCartOptions(cartId)
      .then(({ shipping_options }) => setOptions(shipping_options))
      .catch((e) => console.error('Failed to fetch shipping options', e))
  }, [cartId])

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)
    try {
      await onSubmit(selected)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.id} className="flex items-center gap-3 p-3 border rounded-md">
            <input type="radio" name="shipping" value={opt.id} onChange={() => setSelected(opt.id)} />
            <div className="flex-1">
              <div className="font-medium">{opt.name}</div>
              <div className="text-sm text-gray-600">{opt.description}</div>
            </div>
            <div className="text-sm">{(opt.amount / 100).toLocaleString(undefined, { style: 'currency', currency: opt.currency?.toUpperCase?.() || 'USD' })}</div>
          </label>
        ))}
      </div>
      <button className="btn btn-primary" disabled={!selected || loading} onClick={handleContinue}>
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  )
}
