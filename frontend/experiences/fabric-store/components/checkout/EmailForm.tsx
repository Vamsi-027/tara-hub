import React, { useState } from 'react'

export function EmailForm({ onSubmit, defaultValue }: { onSubmit: (email: string) => Promise<void>, defaultValue?: string }) {
  const [email, setEmail] = useState(defaultValue || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(email)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        required
        className="w-full border rounded px-3 py-2"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </form>
  )
}

