import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!

export interface User {
  id: string
  email: string
  name: string
  role: string
  image?: string
}

export interface Session {
  user: User
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }
    
    const decoded = jwt.verify(token, NEXTAUTH_SECRET) as any
    
    return {
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        image: decoded.image,
      }
    }
    
  } catch (error) {
    return null
  }
}

export async function useSession() {
  if (typeof window === 'undefined') {
    // Server side - use getServerSession
    return await getServerSession()
  }
  
  // Client side - fetch from API
  try {
    const response = await fetch('/api/auth/session')
    const data = await response.json()
    return data.user ? { user: data.user } : null
  } catch (error) {
    return null
  }
}