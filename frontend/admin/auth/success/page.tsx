"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if we have the session before redirecting
    const checkSessionAndRedirect = async () => {
      try {
        console.log('🔍 Checking session before redirect...');
        const response = await fetch('/api/auth/session');
        const { user } = await response.json();
        
        if (user) {
          console.log('✅ Session verified, redirecting to admin...', user);
          router.push('/admin');
        } else {
          console.log('❌ No session found, redirecting to signin...');
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('❌ Session check failed:', error);
        router.push('/auth/signin');
      }
    };

    // Wait a moment for cookie to be set, then check session
    const timer = setTimeout(checkSessionAndRedirect, 1500);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              Redirecting you to the admin panel...
            </p>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}