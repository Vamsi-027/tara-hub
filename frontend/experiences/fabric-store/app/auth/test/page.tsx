'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import UserAccount from '@/components/user-account'

export default function AuthTestPage() {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Authenticated:</strong> {status === 'authenticated' ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {session && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(session.user, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Account Component</h2>
          <UserAccount />
        </div>

        <div className="flex gap-4">
          <Link 
            href="/auth/signin" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Sign In
          </Link>
          <Link 
            href="/browse" 
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go to Browse
          </Link>
        </div>
      </div>
    </div>
  )
}