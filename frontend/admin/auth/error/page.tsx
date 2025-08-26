import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ErrorPageProps {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
}

function getErrorInfo(error: string, message?: string) {
  switch (error) {
    case 'AccessDenied':
      return {
        title: 'Access Denied',
        description: message || 'You do not have permission to access the admin panel. Please contact an administrator if you believe this is an error.',
        canRetry: false,
      };
    case 'InvalidToken':
      return {
        title: 'Invalid Sign-in Link',
        description: message || 'The sign-in link is invalid or has been used already. Please request a new magic link.',
        canRetry: true,
      };
    case 'ExpiredToken':
      return {
        title: 'Link Expired',
        description: message || 'The sign-in link has expired. Please request a new magic link to continue.',
        canRetry: true,
      };
    case 'InvalidEmail':
      return {
        title: 'Invalid Email',
        description: message || 'The email address format is invalid. Please check and try again.',
        canRetry: true,
      };
    case 'RateLimited':
      return {
        title: 'Too Many Attempts',
        description: message || 'Too many sign-in attempts. Please wait a few minutes before trying again.',
        canRetry: false,
      };
    case 'ServerError':
      return {
        title: 'Server Error',
        description: message || 'An unexpected error occurred. Please try again or contact support if the problem persists.',
        canRetry: true,
      };
    case 'Configuration':
      return {
        title: 'Configuration Error',
        description: message || 'Authentication system is not properly configured. Please contact the system administrator.',
        canRetry: false,
      };
    case 'Verification':
      return {
        title: 'Verification Error',
        description: message || 'The verification token has expired or has already been used.',
        canRetry: true,
      };
    default:
      return {
        title: 'Authentication Error',
        description: message || 'An error occurred during authentication. Please try again.',
        canRetry: true,
      };
  }
}

async function AuthErrorContent({ searchParams }: ErrorPageProps) {
  const { error = 'Unknown', message } = await searchParams;
  const errorInfo = getErrorInfo(error, message);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Tara Hub</h1>
          <p className="text-gray-600">Authentication Error</p>
        </div>
        
        {/* Error Card */}
        <Card className="border-red-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="mr-2 h-5 w-5" />
              {errorInfo.title}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {errorInfo.description}
              </AlertDescription>
            </Alert>
            
            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              {errorInfo.canRetry && (
                <Button asChild className="w-full">
                  <Link href="/auth/signin">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Link>
                </Button>
              )}
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go to Homepage
                </Link>
              </Button>
            </div>
            
            {/* Help Text */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need help? Contact{' '}
                <a 
                  href="mailto:admin@tara-hub.com" 
                  className="text-blue-600 hover:underline"
                >
                  admin@tara-hub.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="pt-4">
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Debug Info:</strong></p>
                <p>Error Code: {error}</p>
                {message && <p>Message: {message}</p>}
                <p>Timestamp: {new Date().toISOString()}</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Tara Hub. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-gray-600">Loading error details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthErrorContent searchParams={searchParams} />
    </Suspense>
  );
}