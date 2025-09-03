'use client'

import { useState, useEffect } from 'react'
import { fabricAPI } from '../../lib/fabric-api'

export default function TestAPIPage() {
  const [status, setStatus] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testAPI() {
      const results: any = {}
      
      try {
        // Test 1: List fabrics
        console.log('Testing: List fabrics...')
        const fabrics = await fabricAPI.listFabrics({ limit: 5 })
        results.listFabrics = { success: true, count: fabrics.count, data: fabrics.fabrics }
        console.log('✅ List fabrics:', fabrics)
      } catch (error) {
        results.listFabrics = { success: false, error: (error as Error).message || 'Unknown error' }
        console.error('❌ List fabrics failed:', error)
      }

      try {
        // Test 2: Get collections
        console.log('Testing: Get collections...')
        const collections = await fabricAPI.getCollections()
        results.collections = { success: true, count: collections.collections.length, data: collections.collections }
        console.log('✅ Get collections:', collections)
      } catch (error) {
        results.collections = { success: false, error: (error as Error).message || 'Unknown error' }
        console.error('❌ Get collections failed:', error)
      }

      try {
        // Test 3: Get categories
        console.log('Testing: Get categories...')
        const categories = await fabricAPI.getCategories()
        results.categories = { success: true, count: categories.categories.length, data: categories.categories }
        console.log('✅ Get categories:', categories)
      } catch (error) {
        results.categories = { success: false, error: (error as Error).message || 'Unknown error' }
        console.error('❌ Get categories failed:', error)
      }

      try {
        // Test 4: Search fabrics
        console.log('Testing: Search fabrics...')
        const searchResults = await fabricAPI.searchFabrics('cotton')
        results.search = { success: true, count: searchResults.fabrics.length, data: searchResults.fabrics }
        console.log('✅ Search fabrics:', searchResults)
      } catch (error) {
        results.search = { success: false, error: (error as Error).message || 'Unknown error' }
        console.error('❌ Search fabrics failed:', error)
      }

      setStatus(results)
      setLoading(false)
    }

    testAPI()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Fabric API Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">API Status</h2>
          
          {loading ? (
            <div className="text-gray-500">Testing API endpoints...</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(status).map(([endpoint, result]: [string, any]) => (
                <div key={endpoint} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-lg">{endpoint}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? '✅ Success' : '❌ Failed'}
                    </span>
                  </div>
                  
                  {result.success ? (
                    <div className="text-sm text-gray-600">
                      <p>Count: {result.count}</p>
                      {result.data && result.data.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600">View Data</summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto text-xs">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      Error: {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Testing Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
            <li>First, ensure PostgreSQL is running (Neon database)</li>
            <li>Start Medusa backend: <code className="bg-yellow-100 px-1 rounded">cd backend/medusa/medusa-backend && npm run dev</code></li>
            <li>Or use the script: <code className="bg-yellow-100 px-1 rounded">./scripts/start-medusa-with-fabrics.sh</code></li>
            <li>Medusa should be running on port 9000</li>
            <li>If no data shows, run the seed script to populate fabrics</li>
          </ol>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Integration Complete! 🎉</h3>
          <p className="text-sm text-blue-700 mb-2">
            The fabric-store is now integrated with Medusa backend. The app will:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>Fetch fabric data from Medusa API when available</li>
            <li>Fall back to static data if Medusa is offline</li>
            <li>Support all CRUD operations through the API</li>
            <li>Maintain the same UI/UX experience</li>
          </ul>
        </div>
      </div>
    </div>
  )
}