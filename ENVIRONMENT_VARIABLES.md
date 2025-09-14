# Environment Variables Documentation

This document outlines all environment variables used across the Tara Hub platform applications.

## Overview

The platform consists of three main applications, each with its own set of environment variables:

1. **Main Admin Dashboard** (`/.env.local`)
2. **Medusa Backend** (`/medusa/.env`)
3. **Fabric Store Experience** (`/frontend/experiences/fabric-store/.env.local`)

## Main Admin Dashboard (Root Application)

Location: `/.env.local`

### Database Configuration
- `DATABASE_URL` - Primary PostgreSQL connection string
- `POSTGRES_URL` - PostgreSQL connection (pooled)
- `POSTGRES_URL_NON_POOLING` - PostgreSQL connection (direct)

### Backend Integration
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` - Medusa backend API URL

### Authentication
- `NEXTAUTH_SECRET` - NextAuth.js secret for session encryption
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Email Service
- `RESEND_API_KEY` - Resend API key for email sending
- `RESEND_FROM_EMAIL` - Default sender email address

## Medusa Backend

Location: `/medusa/.env`

### Core Configuration
- `NODE_ENV` - Environment (development/production)
- `MEDUSA_BACKEND_URL` - Backend URL for internal references

### CORS Settings
- `STORE_CORS` - Allowed origins for store API
- `ADMIN_CORS` - Allowed origins for admin API
- `AUTH_CORS` - Allowed origins for auth endpoints

### Database & Caching
- `DATABASE_URL` - PostgreSQL connection string
- `POSTGRES_URL` - Alternative PostgreSQL connection
- `REDIS_URL` - Redis connection for caching

### Security
- `JWT_SECRET` - JWT token signing secret
- `COOKIE_SECRET` - Cookie encryption secret

### Admin Setup
- `MEDUSA_ADMIN_EMAIL` - Initial admin email
- `MEDUSA_ADMIN_PASSWORD` - Initial admin password

### Storage (Cloudflare R2)
- `S3_REGION` - R2 region (usually 'auto')
- `S3_BUCKET_NAME` - R2 bucket name
- `S3_ENDPOINT` - R2 endpoint URL
- `S3_ACCESS_KEY_ID` - R2 access key
- `S3_SECRET_ACCESS_KEY` - R2 secret key
- `S3_PUBLIC_URL` - Public URL for stored files

### CDN Configuration
- `FABRIC_CDN_PREFIX` - CDN prefix for fabric images

### OAuth
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_CALLBACK_URL` - OAuth callback URL

### Payment Processing
- `STRIPE_API_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret

### Email Service
- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Default sender email

## Fabric Store Experience

Location: `/frontend/experiences/fabric-store/.env.local`

### Medusa Integration
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` - Medusa backend URL
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` - Medusa public API key
- `MEDUSA_BACKEND_URL` - Backend URL for server-side calls
- `MEDUSA_ADMIN_TOKEN` - Admin token for privileged API calls

### Payment Processing
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key for server-side

### Application Configuration
- `NODE_ENV` - Environment setting
- `NEXT_PUBLIC_API_URL` - Legacy API URL
- `NEXT_PUBLIC_BASE_URL` - Application base URL
- `NEXT_PUBLIC_APP_NAME` - Application display name

### Email Services
- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Resend sender email
- `GMAIL_USER` - Gmail account for SMTP
- `GMAIL_APP_PASSWORD` - Gmail app-specific password
- `ADMIN_EMAIL` - Admin notification email

### Content Management
- `NEXT_PUBLIC_SANITY_PROJECT_ID` - Sanity project ID
- `NEXT_PUBLIC_SANITY_DATASET` - Sanity dataset name
- `SANITY_API_TOKEN` - Sanity API token

### Authentication
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### SMS Service
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number

## Removed Variables

The following variables were removed as they were not being used in the codebase:

### Previously in Root `.env.local`:
- `MEDUSA_ADMIN_ONBOARDING_TYPE`
- `DB_NAME`
- `S3_FORCE_PATH_STYLE`
- `GOOGLE_AUTO_CREATE_USERS`
- `GOOGLE_DEFAULT_ROLE`
- `GOOGLE_REDIRECT_URI`
- `GMAIL_FROM`
- `EMAIL_SERVER_*` variables
- `EMAIL_FROM`
- `VERCEL_TOKEN`
- `VERCEL_PROJECT_ID`
- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID`
- `MEDUSA_ADMIN_BACKEND_URL`
- Duplicate Cloudflare R2 settings
- Duplicate CORS configurations

### Previously in Medusa `.env`:
- `MEDUSA_ADMIN_ONBOARDING_TYPE`
- `DB_NAME`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM`
- Duplicate Stripe configuration
- `MEDUSA_ADMIN_BACKEND_URL`

### Previously in Fabric Store:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

## Migration Notes

1. **Deployment tokens** (`RAILWAY_TOKEN`, `VERCEL_TOKEN`, etc.) should be stored in CI/CD environment variables, not in `.env` files
2. **Unused email providers** (SendGrid, raw SMTP settings) have been removed in favor of Resend
3. **Duplicate variables** have been consolidated to their appropriate applications
4. **Legacy variables** that were no longer referenced in code have been removed

## Security Best Practices

1. Never commit `.env.local` or `.env` files to version control
2. Use `.env.example` or `.env.template` files as templates
3. Rotate secrets regularly, especially after team member changes
4. Use different credentials for development and production
5. Store deployment tokens in CI/CD platforms, not in environment files