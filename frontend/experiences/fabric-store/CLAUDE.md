# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the fabric-store experience app.

## Project Overview

Fabric Store - A Next.js 15 e-commerce application for browsing and ordering fabric samples. This is a standalone micro-frontend within the Tara Hub monorepo, running on port 3006.

## Architecture

### Application Structure
```
fabric-store/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes (auth, orders, SMS)
│   ├── auth/                 # Authentication pages
│   ├── browse/               # Fabric browsing pages
│   ├── cart/                 # Shopping cart page
│   ├── checkout/             # Checkout flow
│   ├── contact/              # Contact forms
│   ├── fabric/               # Individual fabric pages
│   ├── admin/                # Admin dashboard pages
│   └── test-*/               # Development/testing pages
├── components/               # React components
│   ├── SwatchContext.tsx     # Swatch selection state management
│   ├── WishlistContext.tsx   # Wishlist functionality
│   ├── HeroCarousel.tsx      # Homepage carousel
│   ├── ProductFilters.tsx    # Filter components
│   └── OptimizedFabricDetails.tsx # Fabric detail views
├── lib/                      # Utility libraries
│   ├── fabric-api.ts         # Fabric data API
│   ├── medusa-api.ts         # MedusaJS integration
│   ├── sanity.ts             # Sanity CMS client
│   └── order-storage.ts      # Local order persistence
├── hooks/                    # Custom React hooks
└── config/                   # Configuration files
```

### Technology Stack
- **Framework**: Next.js 15.2.4 with App Router, React 19
- **Styling**: Tailwind CSS with custom configuration
- **Authentication**: NextAuth.js 4.24.11 with Google OAuth + SMS OTP
- **CMS**: Sanity CMS (Project ID: d1t5dcup)
- **State Management**: React Context (SwatchContext, WishlistContext)
- **SMS**: Twilio integration for OTP verification
- **Payments**: Stripe integration (@stripe/react-stripe-js)
- **Backend Integration**: MedusaJS SDK, Custom fabric API
- **Email**: Resend API for notifications
- **Storage**: Vercel KV for session/data persistence

## Development Commands

### Local Development
```bash
# Navigate to fabric-store directory
cd frontend/experiences/fabric-store

# Install dependencies (if needed)
npm install

# Start development server (port 3006)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type checking
npm run type-check
```

### From Monorepo Root
```bash
# Start fabric-store from root directory
npm run dev:fabric-store
```

## Key Features & Functionality

### Core E-commerce Features
- **Fabric Browsing**: Grid view with filtering and search
- **Swatch Selection**: Maximum 5 swatches with persistent cart (SwatchContext)
- **Wishlist**: Save favorite fabrics (WishlistContext)
- **Product Details**: Comprehensive fabric information and images
- **Checkout Flow**: Stripe-powered payment processing
- **Order Management**: Local storage persistence and order tracking

### Authentication System
- **Google OAuth**: Sign in with Google accounts
- **SMS OTP**: Phone number verification via Twilio
- **NextAuth.js**: JWT session management
- **Middleware**: Route protection for authenticated pages

### Content Management
- **Sanity CMS**: Hero carousel, product content
- **Dynamic Content**: Fallback data with CMS integration
- **Image Optimization**: Next.js Image component with Sanity CDN

### API Integration
- **MedusaJS**: Product catalog and order management
- **Fabric API**: Custom fabric data endpoints
- **Stripe API**: Payment processing
- **Twilio API**: SMS verification

## Environment Variables

Required in `.env.local`:
```env
# Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=d1t5dcup
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-api-token-here

# Authentication (NextAuth)
NEXTAUTH_URL=http://localhost:3006
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here

# Twilio SMS
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-number

# Email (Resend)
RESEND_API_KEY=re_your-key-here

# MedusaJS Backend
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=your-medusa-key

# Vercel KV (optional for production)
KV_REST_API_URL=https://your-kv-url
KV_REST_API_TOKEN=your-kv-token
```

## Development Guidelines

### Component Architecture
- **Client Components**: Use `'use client'` for interactive components
- **Context Providers**: SwatchContext and WishlistContext for state management
- **Custom Hooks**: Reusable logic in `/hooks` directory
- **API Routes**: Server-side logic in `/app/api`

### State Management
- **SwatchContext**: Manages selected fabric swatches (max 5)
- **WishlistContext**: Handles wishlist functionality
- **LocalStorage**: Persists swatch and wishlist data across sessions
- **Session Management**: NextAuth for user authentication state

### Styling Conventions
- **Tailwind CSS**: Mobile-first responsive design
- **Custom Colors**: Extended Tailwind config with brand colors
- **Component Variants**: Consistent styling patterns
- **Responsive Design**: Mobile header, desktop navigation

## Testing & Debug Routes

### Development URLs
- **Main App**: `http://localhost:3006`
- **Browse Fabrics**: `http://localhost:3006/browse`
- **Auth Test**: `http://localhost:3006/auth/signin`
- **Cart**: `http://localhost:3006/cart`
- **Admin**: `http://localhost:3006/admin`

### Testing Pages
- **Simple Test**: `http://localhost:3006/simple-test` - Layout and carousel testing
- **Carousel Test**: `http://localhost:3006/test-carousel` - Hero carousel debugging
- **API Test**: `http://localhost:3006/test-api` - API endpoint testing
- **CORS Test**: `http://localhost:3006/cors-test` - Cross-origin request testing

### Test Scripts
- `test-carousel.js` - Standalone carousel testing
- `test-send-sms.js` - SMS functionality testing
- `test-twilio.js` - Twilio integration testing

## Build & Deployment

### Next.js Configuration
- **External Directory**: Monorepo support enabled
- **Type Checking**: Temporarily disabled for builds (ignoreBuildErrors: true)
- **Image Optimization**: Unoptimized for Vercel deployment
- **Webpack Config**: Custom externals for Twilio/xmlbuilder

### Vercel Deployment
- **Region**: iad1 (US East)
- **Framework**: Next.js auto-detection
- **Environment Variables**: Production values in vercel.json
- **Build Command**: Standard Next.js build
- **Node Version**: 18.x (compatible with dependencies)

### Production Configuration
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_NAME": "Fabric Store",
    "NEXT_PUBLIC_MEDUSA_BACKEND_URL": "https://medusa-backend-production-3655.up.railway.app",
    "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY": "pk_production_key"
  }
}
```

## Common Issues & Solutions

### Development Issues
- **Port Conflicts**: Fabric-store runs on port 3006, ensure it's available
- **Twilio Build Issues**: Webpack externals configured for proper bundling
- **Hydration Issues**: Client/server component boundaries properly defined
- **Image Loading**: Sanity CDN images may need proper configuration

### Authentication Issues
- **Google OAuth**: Verify GOOGLE_CLIENT_ID and callback URLs
- **SMS OTP**: Check Twilio credentials and phone number format
- **Session Issues**: Clear browser storage and restart dev server

### API Integration Issues
- **CORS Errors**: Check CORS-API-GUIDE.md for cross-origin setup
- **MedusaJS Connection**: Verify backend URL and publishable key
- **Stripe Errors**: Ensure test keys are properly configured

## Documentation Files

### Available Guides
- **AUTH-SETUP.md**: Complete authentication setup guide
- **TESTING-GUIDE.md**: Hero carousel and component testing
- **CORS-API-GUIDE.md**: Cross-origin request configuration
- **sanity-schema.md**: Sanity CMS schema documentation
- **fix-twilio-30034.md**: Twilio error resolution

### Data Files
- `.orders.json`: Local order data for testing (20KB+ of sample orders)

## Key Development Notes

### Critical Considerations
- **Max 5 Swatches**: SwatchContext enforces swatch selection limit
- **Client-Side State**: Context providers wrap the entire application
- **Mobile-First**: Responsive design prioritizes mobile experience
- **Authentication Required**: Many routes protected by middleware
- **SMS Verification**: Phone number format must be E.164 standard

### Performance Optimizations
- **Image Optimization**: Next.js Image component with proper sizing
- **Code Splitting**: Route-based splitting with App Router
- **Client Components**: Minimal client-side JavaScript
- **API Caching**: SWR for efficient data fetching

### Integration Points
- **Monorepo**: Imports from parent directories for shared utilities
- **MedusaJS**: Product catalog and inventory management
- **Sanity CMS**: Content management for dynamic sections
- **Stripe**: Secure payment processing integration