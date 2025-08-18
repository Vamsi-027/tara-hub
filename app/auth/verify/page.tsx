import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface VerifyPageProps {
  searchParams: Promise<{
    token?: string;
    email?: string;
    error?: string;
  }>;
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <h1 className="text-xl font-semibold">Verifying your sign-in link...</h1>
          <p className="text-gray-600 text-center">Please wait while we verify your authentication.</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function VerifyContent({ searchParams }: VerifyPageProps) {
  const { token, email, error } = await searchParams;

  // Handle error cases
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <XCircle className="h-12 w-12 text-red-600" />
            <h1 className="text-xl font-semibold text-red-700">Verification Failed</h1>
            <p className="text-red-600 text-center">
              {error === 'expired' ? 'This sign-in link has expired. Please request a new one.' : 
               error === 'used' ? 'This sign-in link has already been used.' :
               'Invalid or malformed sign-in link.'}
            </p>
            <a 
              href="/auth/signin" 
              className="text-blue-600 hover:underline text-sm"
            >
              ← Back to sign in
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validate required parameters and redirect to API route for verification
  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <XCircle className="h-12 w-12 text-red-600" />
            <h1 className="text-xl font-semibold text-red-700">Invalid Link</h1>
            <p className="text-red-600 text-center">
              This sign-in link is missing required information. Please request a new magic link.
            </p>
            <a 
              href="/auth/signin" 
              className="text-blue-600 hover:underline text-sm"
            >
              ← Back to sign in
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect to API route for verification (this handles the authentication)
  redirect(`/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`);
}

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <VerifyContent searchParams={searchParams} />
    </Suspense>
  );
}