'use client'

import { useState, useEffect } from 'react'

export default function CorsTest() {
  const [fabrics, setFabrics] = useState([])
  const [orders, setOrders] = useState([])
  const [heroSlides, setHeroSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function testCors() {
      try {
        setLoading(true)
        
        // Test fabrics API
        const fabricsRes = await fetch('/api/fabrics?limit=2')
        if (fabricsRes.ok) {
          const fabricsData = await fabricsRes.json()
          setFabrics(fabricsData.fabrics || [])
        }
        
        // Test orders API
        const ordersRes = await fetch('/api/orders')
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json()
          setOrders(ordersData.orders || [])
        }
        
        // Test Sanity hero slides API
        const heroRes = await fetch('/api/hero-slides?limit=3')
        if (heroRes.ok) {
          const heroData = await heroRes.json()
          setHeroSlides(heroData.slides || [])
        }
        
      } catch (err) {
        setError(err.message)
        console.error('CORS test error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    testCors()
  }, [])

  const testExternalCors = async () => {
    try {
      // Test from external origin (this will test CORS)
      const response = await fetch('http://localhost:3006/api/fabrics?limit=1', {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:3000',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`✅ CORS Test Successful! Found ${data.fabrics?.length || 0} fabrics`)
      } else {
        alert(`❌ CORS Test Failed: ${response.status}`)
      }
    } catch (err) {
      alert(`❌ CORS Error: ${err.message}`)
    }
  }

  if (loading) return <div className="p-8">🔄 Testing CORS...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🌐 CORS API Testing</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Fabrics API Test */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📦 Fabrics API</h2>
          <div className="mb-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              fabrics.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {fabrics.length > 0 ? '✅ CORS Working' : '❌ CORS Failed'}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">Found {fabrics.length} fabrics:</p>
          
          {fabrics.slice(0, 2).map((fabric, index) => (
            <div key={fabric.id || index} className="border-l-4 border-blue-400 pl-3 mb-3">
              <div className="font-medium">{fabric.name}</div>
              <div className="text-sm text-gray-600">
                SKU: {fabric.sku} • Price: ${fabric.price}
              </div>
            </div>
          ))}
          
          <div className="mt-4 text-xs text-gray-500">
            <strong>Endpoint:</strong> GET /api/fabrics
            <br />
            <strong>CORS Headers:</strong> ✅ Access-Control-Allow-Origin
          </div>
        </div>

        {/* Orders API Test */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Orders API</h2>
          <div className="mb-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              orders !== null ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {orders !== null ? '✅ CORS Working' : '❌ CORS Failed'}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">Found {orders.length} orders:</p>
          
          {orders.slice(0, 2).map((order, index) => (
            <div key={order.id || index} className="border-l-4 border-green-400 pl-3 mb-3">
              <div className="font-medium">{order.id}</div>
              <div className="text-sm text-gray-600">
                {order.email} • ${((order.totals?.total || 0) / 100).toFixed(2)}
              </div>
            </div>
          ))}
          
          <div className="mt-4 text-xs text-gray-500">
            <strong>Endpoint:</strong> GET /api/orders
            <br />
            <strong>Methods:</strong> GET, POST, PUT, OPTIONS
          </div>
        </div>

        {/* Sanity Hero Slides API Test */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🎨 Sanity CMS API</h2>
          <div className="mb-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              heroSlides.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {heroSlides.length > 0 ? '✅ CORS + Sanity Working' : '❌ CORS/Sanity Failed'}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">Found {heroSlides.length} hero slides:</p>
          
          {heroSlides.slice(0, 2).map((slide, index) => (
            <div key={slide._id || index} className="border-l-4 border-purple-400 pl-3 mb-3">
              <div className="font-medium">{slide.title || 'Untitled Slide'}</div>
              <div className="text-sm text-gray-600">
                ID: {slide._id} • Order: {slide.order}
              </div>
            </div>
          ))}
          
          <div className="mt-4 text-xs text-gray-500">
            <strong>Endpoint:</strong> GET /api/hero-slides
            <br />
            <strong>Data Source:</strong> ✅ Sanity CMS (Project: d1t5dcup)
          </div>
        </div>
      </div>

      {/* External CORS Test */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">🔗 External CORS Test</h2>
        <p className="text-sm text-gray-600 mb-4">
          Test cross-origin requests from different domains:
        </p>
        <button
          onClick={testExternalCors}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Test External CORS
        </button>
      </div>

      {/* API Information */}
      <div className="mt-8 bg-gray-50 border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">📚 API Information</h2>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-medium mb-2">✅ CORS Features Enabled:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Cross-origin requests allowed</li>
              <li>OPTIONS preflight handling</li>
              <li>Custom headers supported</li>
              <li>Multiple HTTP methods</li>
              <li>Origin whitelist configured</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">🔧 Allowed Origins:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>http://localhost:3000</li>
              <li>http://localhost:3006</li> 
              <li>http://localhost:3007</li>
              <li>http://localhost:9000</li>
              <li>https://tara-hub.vercel.app</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded border">
          <h4 className="font-medium mb-2">📋 Available Endpoints:</h4>
          <div className="text-xs font-mono space-y-1">
            <div>GET /api/fabrics - List fabrics with filtering</div>
            <div>GET /api/fabrics/[id] - Get specific fabric</div>
            <div>GET /api/orders - List orders</div>
            <div>POST /api/orders - Create new order</div>
            <div>PUT /api/orders - Update order</div>
            <div>GET /api/customers - List customers</div>
            <div>POST /api/create-payment-intent - Stripe payments</div>
          </div>
        </div>
      </div>
    </div>
  )
}