# Tara Hub API Service

Standalone Node.js API service for Tara Hub, deployed to Railway platform. This service handles background jobs, webhooks, analytics, and other compute-intensive operations separate from the main Next.js application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                    │
├───────────────────────────────────────────────────────────┤
│  • Next.js App (Admin Dashboard)                         │
│  • Next.js API Routes (/app/api/*)                       │
│  • Fabric Store Experience                               │
│  • Store Guide Experience                                │
│  • Static Assets & SSR/ISR Pages                         │
└───────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST
                            │
┌───────────────────────────────────────────────────────────┐
│                   Railway (Backend API)                   │
├───────────────────────────────────────────────────────────┤
│  • Background Jobs Processing                             │
│  • Webhook Handlers                                       │
│  • Analytics & Reporting                                  │
│  • Data Synchronization                                   │
│  • Heavy Computational Tasks                              │
│  • Direct Database Operations                             │
└───────────────────────────────────────────────────────────┘
                            │
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────────────┐                     ┌───────────────┐
│  PostgreSQL   │                     │     Redis     │
│   (Railway)   │                     │   (Railway)   │
└───────────────┘                     └───────────────┘
```

## Why Separate API Service?

1. **Separation of Concerns**: Keep UI/UX logic in Vercel, business logic in Railway
2. **Resource Optimization**: Heavy tasks don't affect frontend performance
3. **Independent Scaling**: Scale API separately from frontend
4. **Cost Efficiency**: Use Railway for compute-intensive operations
5. **Background Jobs**: Run long-running tasks without timeouts
6. **WebSocket Support**: Railway supports persistent connections

## Features

### Current Implementation
- ✅ Health checks and monitoring endpoints
- ✅ JWT-based authentication middleware
- ✅ Background job processing system
- ✅ Rate limiting and security headers
- ✅ CORS configuration for Vercel apps
- ✅ Structured logging with Winston
- ✅ Error handling middleware
- ✅ Graceful shutdown handling

### Planned Features
- 🔄 WebSocket support for real-time updates
- 🔄 Bull/BullMQ for robust job queuing
- 🔄 Automated data synchronization
- 🔄 Analytics and reporting endpoints
- 🔄 Webhook processing for external services
- 🔄 Caching layer with Redis

## API Endpoints

### Public Endpoints
- `GET /` - API information
- `GET /health` - Health check with dependency status
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `POST /webhooks/*` - Webhook receivers

### Protected Endpoints (Requires JWT)
- `POST /api/jobs` - Create background job
- `GET /api/jobs` - List jobs with filtering
- `GET /api/jobs/:id` - Get job details
- `DELETE /api/jobs/:id` - Cancel job
- `GET /api/analytics/*` - Analytics endpoints
- `POST /api/sync/*` - Data synchronization

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (local or cloud)
- Redis (optional, for caching)

### Setup
```bash
# Navigate to API service directory
cd api-service

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run in development mode
npm run dev
```

### Environment Variables
```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/tara_hub

# Redis (optional)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Authentication
NEXTAUTH_SECRET=your-secret-here
JWT_SECRET=your-jwt-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3006,http://localhost:3007

# Logging
LOG_LEVEL=info
```

## Railway Deployment

### Initial Setup
1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Create new project:
   ```bash
   railway init
   ```

4. Add PostgreSQL:
   ```bash
   railway add postgresql
   ```

5. Add Redis (optional):
   ```bash
   railway add redis
   ```

### Deploy
```bash
# Deploy to Railway
railway up

# View logs
railway logs

# Open in browser
railway open
```

### Environment Variables in Railway
Set these in Railway dashboard or via CLI:
```bash
railway variables set NEXTAUTH_SECRET="your-secret"
railway variables set ALLOWED_ORIGINS="https://tara-hub.vercel.app"
```

## Integration with Next.js App

### Making API Calls from Next.js
```typescript
// In Next.js API route or server component
const API_BASE_URL = process.env.RAILWAY_API_URL || 'http://localhost:4000';

// Create a job
const response = await fetch(`${API_BASE_URL}/api/jobs`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'fabric_sync',
    data: { /* job data */ }
  })
});
```

### Environment Variables for Next.js
Add to `.env.local`:
```env
# Railway API URL
RAILWAY_API_URL=https://tara-hub-api.railway.app
```

## Monitoring

### Health Checks
- Main health: `GET /health`
- Liveness: `GET /health/live`
- Readiness: `GET /health/ready`

### Logs
- Development: Console output
- Production: Combined logs in `combined.log`, errors in `error.log`
- Railway: View via `railway logs` or dashboard

## Security

- JWT authentication for protected endpoints
- Rate limiting on all API endpoints
- Helmet.js for security headers
- CORS configured for allowed origins
- Input validation with Zod
- SQL injection protection via parameterized queries

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Railway PostgreSQL plugin is attached
- Ensure SSL is configured for production

### CORS Errors
- Add frontend URL to `ALLOWED_ORIGINS`
- Verify credentials are included in requests

### Authentication Failures
- Ensure `NEXTAUTH_SECRET` matches between services
- Check JWT token expiration
- Verify token is passed in Authorization header

## Support

For issues or questions:
- Check Railway logs: `railway logs`
- Review health endpoint: `/health`
- Check Vercel-Railway connectivity
- Verify environment variables are set correctly