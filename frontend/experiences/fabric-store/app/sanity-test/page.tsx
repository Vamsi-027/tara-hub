'use client'

import { useState, useEffect } from 'react'

export default function SanityTest() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    searchPlaceholder: '',
    ctaText: '',
    ctaLink: '',
    backgroundGradient: 'blue',
    textColor: 'black',
    order: 1,
    isActive: true
  })

  // Load slides
  const loadSlides = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/hero-slides')
      const data = await response.json()
      setSlides(data.slides || [])
      setError('')
    } catch (err) {
      setError('Failed to load slides')
    } finally {
      setLoading(false)
    }
  }

  // Create slide
  const createSlide = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch('/api/hero-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          features: [
            { text: 'API Created', color: 'green' },
            { text: 'CORS Enabled', color: 'blue' },
            { text: 'Sanity Integrated', color: 'purple' }
          ]
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setSuccess(`✅ Slide created: ${data.slide._id}`)
        setFormData({
          title: '', subtitle: '', description: '', searchPlaceholder: '',
          ctaText: '', ctaLink: '', backgroundGradient: 'blue', textColor: 'black',
          order: 1, isActive: true
        })
        loadSlides() // Refresh list
      } else {
        const errorData = await response.json()
        setError(`❌ Failed to create: ${errorData.error}`)
      }
    } catch (err) {
      setError(`❌ Error: ${(err as Error).message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Delete slide
  const deleteSlide = async (slideId: any) => {
    if (!confirm('Are you sure you want to delete this slide?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/hero-slides?id=${slideId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSuccess(`✅ Slide deleted: ${slideId}`)
        loadSlides() // Refresh list
      } else {
        const errorData = await response.json()
        setError(`❌ Failed to delete: ${errorData.error}`)
      }
    } catch (err) {
      setError(`❌ Error: ${(err as Error).message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  // Toggle slide active status
  const toggleSlide = async (slide: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/hero-slides', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: slide._id,
          isActive: !slide.isActive
        })
      })
      
      if (response.ok) {
        setSuccess(`✅ Slide ${!slide.isActive ? 'activated' : 'deactivated'}`)
        loadSlides() // Refresh list
      } else {
        const errorData = await response.json()
        setError(`❌ Failed to update: ${errorData.error}`)
      }
    } catch (err) {
      setError(`❌ Error: ${(err as Error).message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSlides()
  }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🎨 Sanity CMS API Testing</h1>
      
      {/* Status Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* API Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📡 API Configuration</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Project ID:</strong> d1t5dcup<br/>
            <strong>Dataset:</strong> production<br/>
            <strong>API Token:</strong> ✅ Configured
          </div>
          <div>
            <strong>Read Operations:</strong> ✅ GET /api/hero-slides<br/>
            <strong>Write Operations:</strong> ✅ POST, PUT, DELETE<br/>
            <strong>CORS:</strong> ✅ Enabled
          </div>
          <div>
            <strong>Total Slides:</strong> {slides.length}<br/>
            <strong>Active Slides:</strong> {slides.filter((s: any) => s.isActive).length}<br/>
            <strong>Status:</strong> {loading ? '⏳ Loading...' : '✅ Ready'}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Create Form */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">➕ Create New Hero Slide</h2>
          
          <form onSubmit={createSlide} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Main headline"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                className="w-full p-2 border rounded"
                placeholder="Supporting text"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border rounded h-20"
                placeholder="Detailed description"
                required
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Search Placeholder</label>
                <input
                  type="text"
                  value={formData.searchPlaceholder}
                  onChange={(e) => setFormData({...formData, searchPlaceholder: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Search placeholder text"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                  className="w-full p-2 border rounded"
                  min="1"
                  required
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">CTA Text</label>
                <input
                  type="text"
                  value={formData.ctaText}
                  onChange={(e) => setFormData({...formData, ctaText: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="Button text"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">CTA Link</label>
                <input
                  type="text"
                  value={formData.ctaLink}
                  onChange={(e) => setFormData({...formData, ctaLink: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="/browse"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Background</label>
                <select
                  value={formData.backgroundGradient}
                  onChange={(e) => setFormData({...formData, backgroundGradient: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="green">Green</option>
                  <option value="orange">Orange</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Text Color</label>
                <select
                  value={formData.textColor}
                  onChange={(e) => setFormData({...formData, textColor: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="black">Black</option>
                  <option value="white">White</option>
                </select>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳ Creating...' : '➕ Create Hero Slide'}
            </button>
          </form>
        </div>

        {/* Slides List */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">📋 Existing Hero Slides</h2>
            <button
              onClick={loadSlides}
              disabled={loading}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {slides.map((slide: any) => (
              <div key={(slide as any)._id} className={`border rounded p-3 ${(slide as any).isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{(slide as any).title}</h3>
                    <p className="text-sm text-gray-600">{(slide as any).subtitle}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      Order: {(slide as any).order} • {(slide as any).isActive ? '✅ Active' : '❌ Inactive'} • Background: {(slide as any).backgroundGradient}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleSlide(slide)}
                      disabled={loading}
                      className={`px-2 py-1 rounded text-xs ${
                        (slide as any).isActive 
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } disabled:opacity-50`}
                    >
                      {(slide as any).isActive ? '❌' : '✅'}
                    </button>
                    
                    <button
                      onClick={() => deleteSlide((slide as any)._id)}
                      disabled={loading}
                      className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {slides.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-8">
                No hero slides found. Create your first slide above!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}