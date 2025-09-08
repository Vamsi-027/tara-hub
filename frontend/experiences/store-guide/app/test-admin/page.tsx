"use client"

import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"

export default function TestAdminPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Admin Page</CardTitle>
            <CardDescription>
              NextAuth is not configured for this experience app.
              Please configure NextAuth providers to enable authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                This is a placeholder for admin testing functionality.
              </p>
              <p className="text-sm text-gray-500">
                To enable authentication:
                <ol className="list-decimal list-inside mt-2">
                  <li>Install and configure NextAuth</li>
                  <li>Set up providers (Google, Email, etc.)</li>
                  <li>Add SessionProvider to the app layout</li>
                  <li>Configure environment variables</li>
                </ol>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}