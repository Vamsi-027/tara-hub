'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Mail, Loader2 } from 'lucide-react'

interface MagicLinkFormProps {
  onSuccess?: (email: string) => void
}

export function MagicLinkForm({ onSuccess }: MagicLinkFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error('Failed to send magic link')
      }

      setIsSuccess(true)
      onSuccess?.(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-600">Check your email</CardTitle>
          </div>
          <CardDescription>
            We&apos;ve sent a magic link to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Click the link in your email to sign in. The link will expire in 15 minutes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to Admin</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a magic link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading || !email}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending magic link...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send magic link
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}