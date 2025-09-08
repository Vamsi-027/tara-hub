# Authentication Architecture

## Overview

This application uses a robust, production-ready authentication system built with NextAuth.js, supporting both email (magic links) and OAuth (Google) authentication methods.

## Architecture Components

### 1. Authentication Providers
- **Email (Magic Links)**: Passwordless authentication via Resend
- **Google OAuth**: Social authentication for convenience
- **Extensible**: Easy to add more providers (GitHub, Microsoft, etc.)

### 2. Database Layer
- **Neon PostgreSQL**: Cloud-hosted database for user sessions
- **Drizzle ORM**: Type-safe database operations
- **Fallback Support**: Works without database in development

### 3. Middleware Protection
- **Route-level protection**: Automatic authentication checks
- **Role-based access control**: Admin vs. user permissions
- **API endpoint protection**: Secure API routes

### 4. Session Management
- **JWT Strategy**: Stateless, scalable session handling
- **30-day sessions**: Long-lived but secure
- **Automatic refresh**: Seamless user experience

## Security Features

### Access Control
```typescript
// Admin-only emails (whitelist approach)
const adminEmails = [
  'varaku@gmail.com',
  'admin@deepcrm.ai',
  // Add more admin emails here
];
```

### Protected Routes
```typescript
// Defined in middleware.ts
const protectedRoutes = {
  '/admin': ['admin'],
  '/api/posts': ['admin'],
  '/api/products': ['admin'],
  // ... more protected routes
};
```

## Usage Examples

### Server Components
```typescript
import { requireAdmin } from '@/lib/auth-helpers';

export default async function AdminPage() {
  const session = await requireAdmin(); // Redirects if not admin
  return <div>Admin content</div>;
}
```

### Client Components
```typescript
import { useAuth } from '@/hooks/use-auth';

export function MyComponent() {
  const { user, isAdmin, isLoading } = useAuth({ required: true });
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAdmin) return <div>Not authorized</div>;
  
  return <div>Admin content</div>;
}
```

### API Routes
```typescript
import { getCurrentUser, isAdmin } from '@/lib/auth-helpers';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !await isAdmin()) {
    return new Response('Unauthorized', { status: 401 });
  }
  // Handle request
}
```

## Configuration

### Environment Variables
```env
# Required for authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key

# Email provider (Resend)
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=re_your_api_key
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=465
EMAIL_FROM=Admin <admin@yourdomain.com>

# Database (Neon)
DATABASE_URL=postgresql://user:pass@host/db

# OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Adding New Admin Users

1. Add email to `adminEmails` array in `/lib/auth.ts`
2. The user can then sign in via email or Google
3. They'll automatically get admin privileges

## Extending the System

### Adding New Providers
```typescript
// In lib/auth.ts
import GitHub from "next-auth/providers/github";

providers: [
  // ... existing providers
  GitHub({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }),
]
```

### Adding Custom Roles
```typescript
// Extend the role system
type UserRole = 'admin' | 'editor' | 'viewer' | 'user';

// Update callbacks to assign roles
async session({ session, user }) {
  // Custom role logic here
}
```

### Custom Session Data
```typescript
// Add custom fields to session
callbacks: {
  async session({ session, user }) {
    session.user.customField = await fetchCustomData(user.id);
    return session;
  }
}
```

## Best Practices

1. **Always use middleware** for route protection
2. **Validate on both client and server** for security
3. **Use environment variables** for all secrets
4. **Implement rate limiting** for auth endpoints
5. **Log authentication events** for security audit
6. **Regular security updates** of auth dependencies
7. **Test auth flows regularly** including edge cases

## Troubleshooting

### Common Issues

1. **"Authentication unsuccessful"**
   - Check email/password credentials
   - Verify SMTP settings in Resend
   - Ensure DNS records are configured

2. **"Access Denied"**
   - User email not in admin list
   - Check `adminEmails` in `/lib/auth.ts`

3. **Session not persisting**
   - Check `NEXTAUTH_SECRET` is set
   - Verify cookie settings
   - Check database connection

4. **Middleware not working**
   - Ensure `middleware.ts` is in root directory
   - Check matcher configuration
   - Verify route patterns

## Monitoring

- Track failed login attempts
- Monitor session duration
- Alert on unusual access patterns
- Regular audit of admin users

## Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Session activity logging
- [ ] IP-based restrictions
- [ ] Advanced role permissions
- [ ] OAuth account linking
- [ ] Password authentication option
- [ ] Biometric authentication support