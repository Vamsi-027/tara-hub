import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Store Guide | The Hearth & Home Store',
  description: 'Browse our custom cushions and pillows collection. Handcrafted in Missouri.',
}

export default function StoreGuideHome() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">The Hearth & Home Store</h1>
              <p className="text-sm text-gray-600">Store Guide Experience</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Store Guide</h2>
          <p className="text-lg text-gray-600">Browse our collections and manage your content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/fabrics" className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Fabrics</h3>
            <p className="text-gray-600">Browse our fabric collection</p>
          </Link>

          <Link href="/products" className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Products</h3>
            <p className="text-gray-600">View all products</p>
          </Link>

          <Link href="/blog" className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Blog</h3>
            <p className="text-gray-600">Read our latest posts</p>
          </Link>

          <Link href="/calendar" className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Calendar</h3>
            <p className="text-gray-600">View scheduled posts</p>
          </Link>

          <Link href="/auth/signin" className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Sign In</h3>
            <p className="text-gray-600">Access admin features</p>
          </Link>

          <Link href="/test-auth" className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Test Auth</h3>
            <p className="text-gray-600">Test authentication</p>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500">Running on port 3007 as an independent experience</p>
        </div>
      </main>
    </div>
  )
}