/**
 * Products Listing Page
 * Server Component that fetches data from Medusa
 */

import { Suspense } from 'react'
import { getProducts, getCollections, getCategories } from '../../lib/medusa-api'
import ProductGrid from '../../components/ProductGrid'
import ProductFilters from '../../components/ProductFilters'
import LoadingSpinner from '../../components/LoadingSpinner'

// Metadata for SEO
export const metadata = {
  title: 'Fabric Products - Tara Hub',
  description: 'Browse our collection of premium fabrics',
}

interface PageProps {
  searchParams: {
    q?: string
    collection?: string
    category?: string
    page?: string
    limit?: string
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  // Await searchParams for Next.js 15
  const params = await searchParams
  
  // Parse query parameters
  const currentPage = parseInt(params?.page || '1', 10)
  const limit = parseInt(params?.limit || '12', 10)
  const offset = (currentPage - 1) * limit

  // Build filter parameters
  const filterParams: any = {
    limit,
    offset,
  }

  if (params?.q) {
    filterParams.q = params.q
  }

  if (params?.collection) {
    filterParams.collection_id = [params.collection]
  }

  if (params?.category) {
    filterParams.category_id = [params.category]
  }

  // Fetch data in parallel
  const [productsData, collectionsData, categoriesData] = await Promise.all([
    getProducts(filterParams),
    getCollections({ limit: 50 }),
    getCategories({ limit: 50 }),
  ])

  // Calculate pagination
  const totalPages = Math.ceil(productsData.count / limit)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Fabric Collection</h1>
        <p className="text-gray-600">
          Discover our premium selection of {productsData.count} fabrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <ProductFilters
            collections={collectionsData.collections}
            categories={categoriesData.product_categories}
            currentFilters={{
              collection: params?.collection,
              category: params?.category,
              search: params?.q,
            }}
          />
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3">
          <Suspense fallback={<LoadingSpinner />}>
            <ProductGrid products={productsData.products} />
          </Suspense>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center space-x-2">
              {currentPage > 1 && (
                <a
                  href={`?page=${currentPage - 1}&limit=${limit}`}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Previous
                </a>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <a
                  key={page}
                  href={`?page=${page}&limit=${limit}`}
                  className={`px-4 py-2 rounded ${
                    page === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </a>
              ))}
              
              {currentPage < totalPages && (
                <a
                  href={`?page=${currentPage + 1}&limit=${limit}`}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}