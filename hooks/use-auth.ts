'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UseAuthOptions {
  required?: boolean
  role?: string
}

interface User {
  id: string
  email: string
  name?: string
  role: string
  image?: string
}

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  error: string | null
  signOut: () => Promise<void>
  refetch: () => Promise<void>
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { required = false, role } = options
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (response.ok && data.user) {
        setUser(data.user)
        setError(null)
      } else {
        setUser(null)
        if (required) {
          router.push('/auth/signin')
        }
      }
    } catch (err) {
      console.error('Auth fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to check authentication')
      setUser(null)
      if (required) {
        router.push('/auth/signin')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      setUser(null)
      router.push('/auth/signin')
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  const refetch = async () => {
    await fetchUser()
  }

  useEffect(() => {
    fetchUser()
  }, [])

  // Check role authorization
  useEffect(() => {
    if (!isLoading && user && role) {
      if (!user.role || user.role !== role) {
        if (required) {
          router.push('/auth/signin?error=insufficient_permissions')
        }
      }
    }
  }, [user, isLoading, role, required, router])

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin' || user?.role === 'platform_admin' || user?.role === 'tenant_admin'

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    error,
    signOut,
    refetch
  }
}