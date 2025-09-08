"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminDashboard } from "@/components/admin-dashboard"
import { Loader2 } from "lucide-react"

interface User {
  id: string
  email: string
  name?: string
  role: string
  image?: string
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        
        if (data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        setError('Failed to check authentication status')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">Error</CardTitle>
            <p className="text-gray-600">{error}</p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <p className="text-gray-600">Sign in to access the admin dashboard</p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/auth/signin'}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Sign in with Magic Link
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user has admin role
  if (!['admin', 'platform_admin', 'tenant_admin'].includes(user.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
            <p className="text-gray-600 mt-2">
              You don't have permission to access the admin dashboard.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Logged in as: {user.email}
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/auth/signin'}
              variant="outline"
              className="w-full"
            >
              Sign in with Different Account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <AdminDashboard />
}
