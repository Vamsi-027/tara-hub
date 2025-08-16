"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestGoogleAuth() {
  const { data: session, status } = useSession()
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError("")
    try {
      const result = await signIn("google", { 
        redirect: false,
        callbackUrl: "/admin" 
      })
      
      if (result?.error) {
        setError(`Sign in error: ${result.error}`)
      } else if (result?.ok) {
        window.location.href = result.url || "/admin"
      }
    } catch (err: any) {
      setError(`Exception: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Google OAuth Debug</CardTitle>
          <CardDescription>Test and debug Google OAuth authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Current Status:</h3>
            <p>Auth Status: <span className="font-mono">{status}</span></p>
            {session && (
              <>
                <p>User: <span className="font-mono">{session.user?.email}</span></p>
                <p>Provider: <span className="font-mono">{(session as any).provider}</span></p>
                <p>Role: <span className="font-mono">{(session.user as any)?.role}</span></p>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            {!session ? (
              <Button 
                onClick={handleGoogleSignIn} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Signing in..." : "Sign in with Google"}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => signOut()} 
                  variant="outline"
                  className="flex-1"
                >
                  Sign Out
                </Button>
                <Button 
                  onClick={() => window.location.href = "/admin"}
                  className="flex-1"
                >
                  Go to Admin
                </Button>
              </>
            )}
          </div>

          {/* Debug Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Configuration Check:</h3>
            <ul className="space-y-1 text-sm">
              <li>✓ Google Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'Set' : 'Check .env'}</li>
              <li>✓ NextAuth URL: {process.env.NEXTAUTH_URL || 'Check .env'}</li>
              <li>✓ Callback URL: /api/auth/callback/google</li>
              <li>✓ Admin emails: varaku@gmail.com</li>
            </ul>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-semibold mb-2">If login fails:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Check browser console for errors</li>
              <li>Verify Google Cloud Console redirect URIs include:
                <ul className="ml-6 mt-1">
                  <li>• http://localhost:3003/api/auth/callback/google</li>
                  <li>• https://tara-hub.vercel.app/api/auth/callback/google</li>
                </ul>
              </li>
              <li>Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct</li>
              <li>Check that your email is in the admin list</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}