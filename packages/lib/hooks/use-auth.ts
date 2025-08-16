"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
  role?: 'admin' | 'user';
}

/**
 * Custom hook for authentication
 * @param options - Configuration options
 * @returns Session data and authentication state
 */
export function useAuth(options: UseAuthOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { required = false, redirectTo = '/auth/signin', role } = options;

  useEffect(() => {
    if (required && status === 'unauthenticated') {
      router.push(redirectTo);
    }

    if (role && session && (session.user as any)?.role !== role) {
      router.push('/unauthorized');
    }
  }, [session, status, required, redirectTo, role, router]);

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user || null;
  const isAdmin = (session?.user as any)?.role === 'admin';

  return {
    session,
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    status,
  };
}