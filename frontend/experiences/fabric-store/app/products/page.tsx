'use client'

import Link from 'next/link'
import Header from '@/components/header'
import { ArrowRight } from 'lucide-react'

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Products Coming Soon
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We're working on bringing you an amazing product catalog.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Fabrics Instead
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}