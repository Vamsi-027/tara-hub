"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"

export default function TestAuthPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test Authentication</CardTitle>
          <CardDescription>
            Authentication testing requires NextAuth to be configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This page will display authentication features once NextAuth is set up.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}