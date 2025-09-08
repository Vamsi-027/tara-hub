'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EtsyProductEditor } from '@/components/etsy-product-editor'

export default function EditEtsyProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProduct()
  }, [])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/etsy-products/${params.id}`)
      const data = await response.json()
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (updatedProduct: any) => {
    try {
      const response = await fetch(`/api/etsy-products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      })

      if (response.ok) {
        router.push('/admin/etsy-products')
      }
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-500">Product not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Etsy Product</h1>
        <p className="text-gray-600">Update product details</p>
      </div>

      <EtsyProductEditor
        product={product}
        onSave={handleSave}
        onCancel={() => router.push('/admin/etsy-products')}
      />
    </div>
  )
}