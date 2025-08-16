# Security Steering Document

## Overview

Tara Hub implements comprehensive security measures across authentication, authorization, data protection, and application security. The security architecture leverages NextAuth.js for authentication management and follows modern security best practices for web applications.

## Current Implementation

### Authentication Security

**NextAuth.js Integration**
```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "Hearth & Home <noreply@yourdomain.com>",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // Additional security configuration
};
```

**Authentication Providers**
1. **Google OAuth 2.0**
   - Secure OAuth flow implementation
   - Client credentials stored in environment variables
   - Scope-limited access to user profile information

2. **Email Magic Links**
   - Passwordless authentication via email
   - Time-limited verification tokens
   - SMTP server configuration for email delivery

**Session Management**
- HTTP-only cookies for session storage
- Secure session token generation
- Automatic session expiration handling
- CSRF protection built into NextAuth.js

### Authorization Framework

**Role-Based Access Control (RBAC)**
```typescript
// Admin role identification
const adminEmails = ['varaku@gmail.com'];

callbacks: {
  async session({ session, user }) {
    if (session.user) {
      session.user.id = user.id;
      if (session.user.email && adminEmails.includes(session.user.email)) {
        (session.user as any).role = 'admin';
      } else {
        (session.user as any).role = 'user';
      }
    }
    return session;
  },
}
```

**Access Control Implementation**
- Email-based admin identification
- Role information stored in session
- Component-level access control
- Route protection through authentication checks

**Protected Route Example**
```typescript
// app/admin/page.tsx
if (!session) {
  return <LoginPrompt />;
}

if ((session.user as any)?.role !== 'admin') {
  return <AccessDenied />;
}

return <AdminDashboard />;
```

### Data Protection

**Environment Variable Security**
```env
# Authentication secrets
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://your-domain.vercel.app

# OAuth credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database connection
DATABASE_URL=postgresql://username:password@host:port/database
```

**Sensitive Data Handling**
- Environment variables for all secrets
- No hardcoded credentials in source code
- Secure transmission over HTTPS
- Database connection string encryption

**Database Security**
```typescript
// Graceful fallback for missing database credentials
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
}
```

### Application Security

**Cross-Site Request Forgery (CSRF) Protection**
- Built-in CSRF protection via NextAuth.js
- SameSite cookie attributes
- Origin validation for requests

**Cross-Site Scripting (XSS) Prevention**
- React's built-in XSS protection
- Content Security Policy headers (planned)
- Input sanitization for user-generated content

**SQL Injection Prevention**
- Drizzle ORM parameterized queries
- Type-safe database operations
- No raw SQL query construction

```typescript
// Safe parameterized queries
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, userEmail)); // Safe parameter binding
```

**Secure Headers**
```typescript
// next.config.mjs security headers
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];
```

## Security Architecture Patterns

### Authentication Flow Security

**OAuth 2.0 Flow Protection**
1. **Authorization Request**
   - State parameter for CSRF protection
   - Secure redirect URI validation
   - Scope limitation to required permissions

2. **Token Exchange**
   - Authorization code flow (not implicit)
   - Client secret validation
   - Token expiration handling

3. **Session Establishment**
   - Secure session token generation
   - HTTP-only cookie storage
   - SameSite cookie attributes

**Email Authentication Security**
1. **Magic Link Generation**
   - Cryptographically secure token generation
   - Time-limited token validity (configurable)
   - Single-use token enforcement

2. **Email Delivery**
   - SMTP over TLS/SSL
   - Rate limiting for email sending
   - Bounce and delivery tracking

3. **Token Verification**
   - Constant-time comparison for token validation
   - Automatic token cleanup after use
   - Session establishment upon verification

### Session Security

**Session Token Management**
```typescript
// NextAuth.js session configuration
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "database", // or "jwt" for stateless
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  }
};
```

**Session Validation**
- Automatic session refresh
- Session expiration handling
- Concurrent session management
- Session revocation capabilities

### Database Security

**Connection Security**
- TLS encryption for database connections
- Connection pooling with secure credentials
- Network-level access restrictions
- Database firewall rules

**Data Encryption**
- Encryption at rest (provider-managed)
- Encryption in transit (TLS)
- Sensitive field encryption (planned)
- Key management through provider

**Access Control**
- Database user permissions
- Schema-level access control
- Row-level security (planned)
- Audit logging capabilities

## Security Guidelines

### Development Security Practices

**Code Security Standards**
1. **Input Validation**
   - Validate all user inputs
   - Use Zod schemas for runtime validation
   - Sanitize data before database operations
   - Implement proper error handling

2. **Authentication Checks**
   - Verify authentication on all protected routes
   - Implement proper authorization logic
   - Use middleware for route protection
   - Handle authentication failures gracefully

3. **Secret Management**
   - Never commit secrets to version control
   - Use environment variables for configuration
   - Rotate secrets regularly
   - Implement secret scanning in CI/CD

**Component Security Patterns**
```typescript
// Protected component pattern
function ProtectedComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <Loading />;
  if (!session) return <Unauthorized />;
  if (session.user.role !== 'admin') return <Forbidden />;
  
  return <SensitiveContent />;
}

// API route protection
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Process authenticated request
}
```

### Deployment Security

**Environment Configuration**
- Separate environments for development/staging/production
- Environment-specific secret management
- Secure deployment pipelines
- Infrastructure as code practices

**Monitoring and Alerting**
- Authentication failure monitoring
- Unusual access pattern detection
- Security event logging
- Incident response procedures

### Compliance and Privacy

**Data Privacy**
- GDPR compliance for EU users
- User data retention policies
- Right to deletion implementation
- Privacy policy transparency

**Security Auditing**
- Regular security assessments
- Dependency vulnerability scanning
- Code security reviews
- Penetration testing (planned)

## Future Security Enhancements

### Advanced Authentication

**Multi-Factor Authentication (MFA)**
- TOTP (Time-based One-Time Password) support
- SMS authentication backup
- Recovery codes generation
- Hardware security key support

**Enhanced Session Security**
- Device fingerprinting
- Geolocation-based security
- Suspicious activity detection
- Automatic session termination

### Content Security Policy (CSP)

**CSP Implementation**
```typescript
// Planned CSP headers
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;
```

### API Security

**Rate Limiting**
- Request rate limiting per IP/user
- API endpoint protection
- Brute force attack prevention
- Resource consumption controls

**API Authentication**
- API key management
- JWT token authentication
- Scope-based API access
- Third-party integration security

### Advanced Monitoring

**Security Information and Event Management (SIEM)**
- Centralized security event logging
- Real-time threat detection
- Automated incident response
- Security metrics and reporting

**Vulnerability Management**
- Automated dependency scanning
- Security patch management
- Zero-day vulnerability response
- Security baseline maintenance

This security framework provides comprehensive protection while maintaining usability and developer productivity. Regular security reviews and updates ensure the system remains secure against evolving threats.