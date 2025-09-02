'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { User, LogOut, Phone, Mail } from 'lucide-react'

export default function UserAccount() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/browse')
  }

  if (status === 'loading') {
    return (
      <div className="animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <button
        onClick={() => router.push('/auth/signin')}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <User className="w-4 h-4" />
        Sign In
      </button>
    )
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="hidden sm:inline">{session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-4 border-b border-gray-200">
          <p className="font-medium text-gray-900">{session?.user?.name || 'User'}</p>
          {session?.user?.email && !session?.user?.email.includes('@phone.auth') && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Mail className="w-3 h-3" />
              {session?.user?.email}
            </p>
          )}
          {(session?.user as any)?.phone && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3" />
              {(session?.user as any)?.phone}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Signed in via {(session?.user as any)?.provider === 'google' ? 'Google' : 'Phone OTP'}
          </p>
        </div>
        
        <div className="p-2">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}