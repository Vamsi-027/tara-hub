# Authentication Setup Guide

## Overview
The fabric-store app now supports two authentication methods:
1. **Google OAuth** - Sign in with Google account
2. **Phone OTP** - Sign in with phone number and OTP verification

## Features Implemented

### 1. NextAuth.js Integration
- Full NextAuth setup with JWT session strategy
- Custom authentication pages at `/auth/signin`
- Session provider wrapping the entire app
- Middleware protection for authenticated routes

### 2. Google OAuth
- Google provider configured in NextAuth
- Automatic user creation on first sign-in
- Profile information extracted from Google account

### 3. Phone OTP Authentication
- Custom credentials provider for phone authentication
- OTP generation (6-digit codes)
- 10-minute expiration for OTP codes
- Twilio integration for SMS delivery
- Development mode with console OTP display

### 4. Protected Routes
Routes that require authentication:
- `/checkout` - Checkout process
- `/cart` - Shopping cart
- `/wishlist` - User wishlist
- `/admin` - Admin panel
- `/order-success` - Order confirmation

Public routes (no auth required):
- `/browse` - Browse fabrics
- `/fabric` - Fabric details
- `/products` - Product catalog
- `/auth/signin` - Sign in page

### 5. User Interface Components
- **Sign In Page** (`/auth/signin`): Unified login with both methods
- **User Account Component**: Shows login status in header
- **Session Management**: Automatic session refresh

## Environment Variables Setup

Add these to your `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3006
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
JWT_SECRET=<same-as-nextauth-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Twilio Configuration (Optional for development)
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_PHONE_NUMBER=+1234567890
```

## Getting Started

### 1. Generate Secret Keys
```bash
openssl rand -base64 32
```
Use this command to generate `NEXTAUTH_SECRET` and `JWT_SECRET`.

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3006/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

### 3. Twilio Setup (Optional)
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token
3. Purchase a phone number for sending SMS
4. Add credentials to `.env.local`

**Note**: In development mode without Twilio, OTPs are displayed in the console and shown in an alert.

## Development Mode

When Twilio is not configured:
- OTP codes are logged to console
- An alert shows the OTP for testing
- Perfect for local development without SMS costs

## API Routes

### Authentication Endpoints
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler
- `POST /api/auth/send-otp` - Send OTP to phone number
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signout` - Sign out user

### Send OTP Request
```javascript
POST /api/auth/send-otp
{
  "phone": "+1234567890"
}
```

### Verify OTP (via NextAuth)
```javascript
signIn('phone-otp', {
  phone: '+1234567890',
  otp: '123456',
  redirect: false
})
```

## Usage in Components

### Check Authentication Status
```javascript
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'authenticated') {
    // User is signed in
    console.log(session.user)
  }
}
```

### Sign In/Out
```javascript
import { signIn, signOut } from 'next-auth/react'

// Sign in with Google
signIn('google')

// Sign in with Phone OTP
signIn('phone-otp', { phone, otp })

// Sign out
signOut()
```

### Protected Page
```javascript
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function ProtectedPage() {
  const { status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status])
  
  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return null
  
  return <div>Protected content</div>
}
```

## Security Considerations

1. **JWT Secret**: Keep `NEXTAUTH_SECRET` secure and never commit to version control
2. **HTTPS**: Always use HTTPS in production
3. **Phone Validation**: Implement proper phone number validation
4. **Rate Limiting**: Add rate limiting to OTP endpoints in production
5. **OTP Storage**: In production, use Redis or database for OTP storage

## Troubleshooting

### Google OAuth Not Working
- Check redirect URIs in Google Console
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Verify NextAuth URL matches your domain

### OTP Not Sending
- Check Twilio credentials
- Verify phone number format (include country code)
- Check Twilio account balance
- In dev mode, check console for OTP

### Session Not Persisting
- Ensure `NEXTAUTH_SECRET` is set
- Check cookie settings in browser
- Verify `NEXTAUTH_URL` matches your domain

## Next Steps

1. **Database Integration**: Store users in database instead of JWT only
2. **Email Authentication**: Add email + password option
3. **Social Providers**: Add more OAuth providers (Facebook, Twitter)
4. **Profile Management**: User profile editing
5. **Rate Limiting**: Implement rate limiting for OTP requests
6. **Analytics**: Track authentication events