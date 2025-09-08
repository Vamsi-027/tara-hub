'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Edit, Trash, Search, ExternalLink, Star } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface EtsyProduct {
  id: string
  title: string
  description?: string
  listingUrl: string
  imageUrl?: string
  price?: string
  featured: boolean
  displayOrder: number
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export default function EtsyProductsPage() {
  const [products, setProducts] = useState<EtsyProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<EtsyProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const filtered = products.filter(product =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/etsy-products')
      const data = await response.json()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/etsy-products/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await fetchProducts()
        setDeleteId(null)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const toggleFeatured = async (product: EtsyProduct) => {
    try {
      const response = await fetch(`/api/etsy-products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featured: !product.featured }),
      })
      
      if (response.ok) {
        await fetchProducts()
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
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Etsy Products</h1>
        <p className="text-gray-600">Manage your Etsy store product listings for featuring on the website</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search products or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Link href="/admin/etsy-products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Etsy Product
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Listing URL</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{product.title}</p>
                    {product.description && (
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={product.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    View on Etsy
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </TableCell>
                <TableCell>{product.price || '-'}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFeatured(product)}
                    className={product.featured ? 'text-amber-600' : 'text-gray-400'}
                  >
                    <Star className={`h-4 w-4 ${product.featured ? 'fill-current' : ''}`} />
                  </Button>
                </TableCell>
                <TableCell>{product.displayOrder}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {product.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/admin/etsy-products/${product.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(product.id)}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}