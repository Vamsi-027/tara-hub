"use client"

import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminDashboard } from "@/components/admin-dashboard"

export default function AdminPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <p className="text-gray-600">Sign in to access the admin dashboard</p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => signIn('google')}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user has admin role
  if ((session.user as any)?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
            <p className="text-gray-600 mt-2">
              You don't have permission to access the admin dashboard.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Logged in as: {session.user?.email}
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => signIn('google')}
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
