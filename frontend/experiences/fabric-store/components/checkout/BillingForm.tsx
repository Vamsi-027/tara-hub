import React, { useState } from 'react'
import { AddressForm, AddressInput } from './AddressForm'

export function BillingForm({ onSubmit, shippingAddress }: { onSubmit: (address: AddressInput, sameAsShipping: boolean) => Promise<void>, shippingAddress?: any }) {
  const [sameAsShipping, setSameAsShipping] = useState(true)

  const handleSubmit = async (address?: AddressInput) => {
    await onSubmit(address as AddressInput, sameAsShipping)
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={sameAsShipping} onChange={(e) => setSameAsShipping(e.target.checked)} />
        <span>Same as shipping address</span>
      </label>
      {sameAsShipping ? (
        <div className="text-sm text-gray-600">
          Using shipping address for billing.
        </div>
      ) : (
        <AddressForm onSubmit={handleSubmit} defaultValue={shippingAddress} />
      )}
      {sameAsShipping && (
        <button className="btn btn-primary" onClick={() => handleSubmit()}>
          Continue
        </button>
      )}
    </div>
  )
}

