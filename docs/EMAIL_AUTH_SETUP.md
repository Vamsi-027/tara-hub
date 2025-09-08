# Email Authentication Setup Guide

This guide explains how to set up email-based (magic link) authentication for the admin panel.

## Prerequisites

1. A Neon database account (or any PostgreSQL database)
2. An SMTP email service (Gmail, SendGrid, AWS SES, Resend, etc.)

## Setup Steps

### 1. Database Setup

#### Option A: Using Neon (Recommended)
1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new database
3. Copy the connection string from the dashboard
4. Add it to your `.env.local`:
   ```
   DATABASE_URL=your-neon-connection-string
   ```

#### Option B: Using Another PostgreSQL Database
1. Ensure you have a PostgreSQL database running
2. Add the connection string to `.env.local`:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

### 2. Run Database Migrations

Once your database is configured, create the necessary tables:

```bash
# Generate the migration files
npm run db:generate

# Push the schema to your database
npm run db:push
```

### 3. Email Provider Setup

#### Option A: Using Gmail
1. Enable 2-factor authentication on your Google account
2. Generate an app-specific password:
   - Go to [Google Account Settings](https://myaccount.google.com/apppasswords)
   - Select "Mail" and generate a password
3. Add to `.env.local`:
   ```
   EMAIL_SERVER_USER=your-email@gmail.com
   EMAIL_SERVER_PASSWORD=your-app-specific-password
   EMAIL_SERVER_HOST=smtp.gmail.com
   EMAIL_SERVER_PORT=587
   EMAIL_FROM=Your Name <your-email@gmail.com>
   ```

#### Option B: Using SendGrid
1. Create a SendGrid account and API key
2. Add to `.env.local`:
   ```
   EMAIL_SERVER_USER=apikey
   EMAIL_SERVER_PASSWORD=your-sendgrid-api-key
   EMAIL_SERVER_HOST=smtp.sendgrid.net
   EMAIL_SERVER_PORT=587
   EMAIL_FROM=Your Name <noreply@yourdomain.com>
   ```

#### Option C: Using Microsoft 365
1. Use your Microsoft 365 email credentials
2. Add to `.env.local`:
   ```
   EMAIL_SERVER_USER=your-email@yourdomain.com
   EMAIL_SERVER_PASSWORD=your-password
   EMAIL_SERVER_HOST=smtp.office365.com
   EMAIL_SERVER_PORT=587
   EMAIL_FROM=Your Name <your-email@yourdomain.com>
   ```
   
   **Important for Microsoft 365:**
   - If you have 2FA enabled, you may need to create an app password:
     1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
     2. Click on "Advanced security options"
     3. Under "App passwords", create a new app password
     4. Use this app password instead of your regular password
   - Ensure SMTP authentication is enabled in your Microsoft 365 admin center

#### Option D: Using Resend
1. Create a Resend account at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env.local`:
   ```
   EMAIL_SERVER_USER=resend
   EMAIL_SERVER_PASSWORD=your-resend-api-key
   EMAIL_SERVER_HOST=smtp.resend.com
   EMAIL_SERVER_PORT=465
   EMAIL_FROM=Your Name <onboarding@resend.dev>
   ```

### 4. Complete Environment Variables

Your `.env.local` should now include:

```env
# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-generated-secret

# Google OAuth (still works alongside email)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (required for email auth)
DATABASE_URL=your-database-connection-string

# Email Provider
EMAIL_SERVER_USER=your-smtp-username
EMAIL_SERVER_PASSWORD=your-smtp-password
EMAIL_SERVER_HOST=smtp-host
EMAIL_SERVER_PORT=587
EMAIL_FROM=Your Name <noreply@yourdomain.com>

# Vercel KV (optional)
KV_REST_API_URL=your-kv-url
KV_REST_API_TOKEN=your-kv-token
```

## Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/auth/signin`

3. You should see two options:
   - "Sign in with Google" button
   - Email input field with "Sign in with Email" button

4. Enter your admin email (`varaku@gmail.com` or any email you've configured as admin)

5. Click "Sign in with Email"

6. Check your email for the magic link

7. Click the link to sign in

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_URL` is correctly set
- Check that your database is accessible from your development environment
- For Vercel deployments, add the `DATABASE_URL` to your Vercel project settings

### Email Not Sending
- Verify your SMTP credentials are correct
- Check spam/junk folder
- For Gmail, ensure you're using an app-specific password, not your regular password
- Check that `EMAIL_FROM` address is valid

### Authentication Not Working
- Ensure `NEXTAUTH_SECRET` is set (generate with `openssl rand -base64 32`)
- For production, update `NEXTAUTH_URL` to your production domain
- Check browser console for any JavaScript errors

## Admin Access

Currently, admin access is granted to:
- `varaku@gmail.com`

To add more admin emails, edit the `adminEmails` array in `lib/auth.ts`.

## Security Notes

- Magic links expire after 24 hours by default
- Each magic link can only be used once
- Always use HTTPS in production
- Keep your `NEXTAUTH_SECRET` secure and never commit it to version control