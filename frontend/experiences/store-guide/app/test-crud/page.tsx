"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"

export default function TestCrudPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Test CRUD Operations</CardTitle>
          <CardDescription>
            CRUD testing requires authentication to be configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This page will display CRUD operations once NextAuth is configured.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}