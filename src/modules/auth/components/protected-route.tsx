"use client";

import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'admin' | 'user';
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  role = 'admin',
  fallback 
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth({ 
    required: true,
    role 
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || null;
  }

  if (role === 'admin' && !isAdmin) {
    return fallback || null;
  }

  return <>{children}</>;
}