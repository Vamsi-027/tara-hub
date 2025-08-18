"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
  role?: 'admin' | 'user';
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

/**
 * Custom hook for authentication using our custom auth system
 * @param options - Configuration options
 * @returns Session data and authentication state
 */
export function useAuth(options: UseAuthOptions = {}) {
  const router = useRouter();
  const { required = false, redirectTo = '/auth/signin', role } = options;
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (required && !user) {
        router.push(redirectTo);
      }

      if (role && user && !['admin', 'platform_admin', 'tenant_admin'].includes(user.role)) {
        router.push('/unauthorized');
      }
    }
  }, [user, isLoading, required, redirectTo, role, router]);

  const isAuthenticated = !!user;
  const isAdmin = user && ['admin', 'platform_admin', 'tenant_admin'].includes(user.role);
  
  // Create a session-like object for compatibility
  const session = user ? { user } : null;

  return {
    session,
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    status: isLoading ? 'loading' : (isAuthenticated ? 'authenticated' : 'unauthenticated'),
  };
}

/**
 * Custom signOut function to replace NextAuth signOut
 */
export async function signOut(options: { callbackUrl?: string } = {}) {
  try {
    const response = await fetch('/api/auth/signout', {
      method: 'POST',
    });
    
    if (response.ok) {
      // Redirect to callback URL or home
      window.location.href = options.callbackUrl || '/';
    }
  } catch (error) {
    console.error('Sign out failed:', error);
    // Force redirect even if the API call fails
    window.location.href = options.callbackUrl || '/';
  }
}