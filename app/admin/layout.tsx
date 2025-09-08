"use client"

import { useAuth } from "@/hooks/use-auth"
import { AppSidebar } from "@/components/app-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth({ 
    required: true,
    role: 'admin' 
  })

  // Show loading state during initial hydration
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Show redirecting message if not authorized
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full">
      <AppSidebar className="border-r" />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="h-full w-full">
          {children}
        </div>
      </main>
    </div>
  )
}