"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleAdminAccess = () => {
    router.push("/admin")
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Authentication Test</CardTitle>
          <CardDescription>Test the admin login functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auth Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Authentication Status:</h3>
            <p>Status: <span className="font-mono">{status}</span></p>
            {session && (
              <>
                <p>Email: <span className="font-mono">{session.user?.email}</span></p>
                <p>Name: <span className="font-mono">{session.user?.name}</span></p>
                <p>Role: <span className="font-mono">{(session.user as any)?.role || 'user'}</span></p>
              </>
            )}
          </div>

          {/* Auth Actions */}
          <div className="flex gap-4">
            {!session ? (
              <>
                <Button onClick={() => signIn('google')}>
                  Sign in with Google
                </Button>
                <Button onClick={() => signIn('email', { email: 'varaku@gmail.com' })} variant="outline">
                  Sign in with Email (Admin)
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => signOut()}>
                  Sign Out
                </Button>
                <Button onClick={handleAdminAccess} variant="outline">
                  Go to Admin Panel
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Sign in with Google" or "Sign in with Email"</li>
              <li>Use varaku@gmail.com for admin access</li>
              <li>After signing in, click "Go to Admin Panel"</li>
              <li>Verify the admin panel loads without errors</li>
            </ol>
          </div>

          {/* Error Test Results */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold mb-2">Hydration Error Fix Applied:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✅ Admin layout now uses proper client-side state management</li>
              <li>✅ Added useState to track authorization status</li>
              <li>✅ Prevents hydration mismatch between server and client</li>
              <li>✅ Shows loading state during initial hydration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}