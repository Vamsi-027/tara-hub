'use client'

import { useRouter } from 'next/navigation'
import { EtsyProductEditor } from '@/components/etsy-product-editor'

export default function NewEtsyProductPage() {
  const router = useRouter()

  const handleSave = async (product: any) => {
    try {
      const response = await fetch('/api/etsy-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      })

      if (response.ok) {
        router.push('/admin/etsy-products')
      }
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add Etsy Product</h1>
        <p className="text-gray-600">Add a new product from your Etsy store</p>
      </div>

      <EtsyProductEditor
        onSave={handleSave}
        onCancel={() => router.push('/admin/etsy-products')}
      />
    </div>
  )
}