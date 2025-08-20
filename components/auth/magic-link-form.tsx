'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MagicLinkFormProps {
  onSuccess?: (email: string) => void;
  className?: string;
}

export function MagicLinkForm({ onSuccess, className = '' }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setMessage('');
    setIsSuccess(false);

    try {
      // Use absolute URL in production
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/auth/signin`;
      
      console.log('Sending magic link request to:', apiUrl);
      console.log('Email:', email.trim());
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
        credentials: 'same-origin',
      });

      const data = await response.json();
      
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (response.ok) {
        setIsSuccess(true);
        setMessage('Magic link sent! Check your email to sign in.');
        onSuccess?.(data.email);
        
        // Clear form after success
        setEmail('');
      } else {
        console.error('Error response:', data);
        setError(data.error || 'Something went wrong. Please try again.');
        
        // Show retry info for rate limiting
        if (response.status === 429 && data.retryAfter) {
          const minutes = Math.ceil(data.retryAfter / 60);
          setError(`Too many attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`);
        }
      }
    } catch (err) {
      console.error('Signin error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear errors when user starts typing
    if (error) setError('');
    if (isSuccess) setIsSuccess(false);
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-bold">Admin Sign In</CardTitle>
        <p className="text-muted-foreground text-sm">
          Enter your email to receive a secure sign-in link
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your admin email address"
              value={email}
              onChange={handleEmailChange}
              required
              disabled={isLoading}
              className="h-11"
              autoComplete="email"
              autoFocus
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-11" 
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Magic Link...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Magic Link
              </>
            )}
          </Button>
        </form>
        
        {/* Success message */}
        {isSuccess && message && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {message}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Instructions */}
        <div className="text-center space-y-3 pt-2">
          <p className="text-xs text-muted-foreground">
            Only authorized administrators can access the admin panel
          </p>
          
          {isSuccess && (
            <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Check your email!</strong> We've sent a secure sign-in link to{' '}
                <span className="font-medium">{email}</span>. 
                The link expires in 15 minutes.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}