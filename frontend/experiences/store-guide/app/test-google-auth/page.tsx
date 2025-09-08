"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"

export default function TestGoogleAuthPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test Google Authentication</CardTitle>
          <CardDescription>
            Google OAuth testing requires NextAuth to be configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This page will display Google authentication once OAuth is configured.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}