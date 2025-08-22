# API Documentation - Tara Hub

## Overview
Tara Hub uses Next.js App Router with API routes for backend functionality.

## API Routes Structure

### Authentication (`/api/auth/`)
- **NextAuth.js** integration
- Google OAuth provider
- Email/password authentication
- Session management with JWT

### Core API Endpoints

#### Content Management
- `POST /api/content/create` - Create new social media content
- `GET /api/content/list` - Retrieve content calendar
- `PUT /api/content/[id]` - Update content item
- `DELETE /api/content/[id]` - Delete content item
- `GET /api/content/schedule` - Get scheduled posts

#### Fabric Catalog
- `GET /api/fabrics` - List all fabrics
- `GET /api/fabrics/[id]` - Get fabric details
- `POST /api/fabrics` - Add new fabric (admin only)
- `PUT /api/fabrics/[id]` - Update fabric (admin only)
- `DELETE /api/fabrics/[id]` - Delete fabric (admin only)

#### Etsy Integration
- `POST /api/etsy/sync` - Sync products with Etsy
- `GET /api/etsy/orders` - Fetch Etsy orders
- `POST /api/etsy/listing` - Create Etsy listing
- `PUT /api/etsy/inventory` - Update inventory

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/social` - Social media performance
- `GET /api/analytics/sales` - Sales analytics

## Request/Response Patterns

### Standard Response Format
```typescript
{
  success: boolean,
  data?: any,
  error?: {
    code: string,
    message: string
  },
  meta?: {
    page?: number,
    total?: number,
    timestamp: string
  }
}
```

### Authentication Headers
```
Authorization: Bearer [token]
X-Session-Token: [session-id]
```

### Rate Limiting
- 100 requests per minute for authenticated users
- 20 requests per minute for public endpoints
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Error Handling

### Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `429` - Rate limit exceeded
- `500` - Internal server error

### Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Security Measures
- CORS configuration for allowed origins
- CSRF protection with tokens
- Input validation using Zod schemas
- SQL injection prevention via Drizzle ORM
- XSS protection headers

## Integration Points
- **Etsy API**: Product synchronization
- **Social Media APIs**: Instagram, Facebook, Pinterest
- **Payment Processing**: Stripe integration
- **Email Service**: SendGrid for notifications
- **CDN**: Cloudinary for image optimization