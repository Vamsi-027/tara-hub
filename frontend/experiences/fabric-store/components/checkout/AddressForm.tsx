import React, { useState } from 'react'

export interface AddressInput {
  firstName: string
  lastName: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  countryCode?: string
  phone?: string
}

export function AddressForm({ onSubmit, defaultValue }: { onSubmit: (address: AddressInput) => Promise<void>, defaultValue?: any }) {
  const [address, setAddress] = useState<AddressInput>({
    firstName: defaultValue?.first_name || '',
    lastName: defaultValue?.last_name || '',
    line1: defaultValue?.address_1 || '',
    line2: defaultValue?.address_2 || '',
    city: defaultValue?.city || '',
    state: defaultValue?.province || '',
    postalCode: defaultValue?.postal_code || '',
    countryCode: defaultValue?.country_code || 'us',
    phone: defaultValue?.phone || '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (key: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(address)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input className="border rounded px-3 py-2" placeholder="First name" value={address.firstName} onChange={handleChange('firstName')} required />
      <input className="border rounded px-3 py-2" placeholder="Last name" value={address.lastName} onChange={handleChange('lastName')} required />
      <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Address line 1" value={address.line1} onChange={handleChange('line1')} required />
      <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Address line 2 (optional)" value={address.line2} onChange={handleChange('line2')} />
      <input className="border rounded px-3 py-2" placeholder="City" value={address.city} onChange={handleChange('city')} required />
      <input className="border rounded px-3 py-2" placeholder="State/Province" value={address.state} onChange={handleChange('state')} />
      <input className="border rounded px-3 py-2" placeholder="Postal code" value={address.postalCode} onChange={handleChange('postalCode')} required />
      <input className="border rounded px-3 py-2" placeholder="Country code (e.g., us)" value={address.countryCode} onChange={handleChange('countryCode')} />
      <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Phone (optional)" value={address.phone} onChange={handleChange('phone')} />
      <div className="md:col-span-2">
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Continue'}</button>
      </div>
    </form>
  )
}

