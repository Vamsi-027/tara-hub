# Fabric Store - Medusa Backend Integration Guide

## Overview
This guide documents the integration between the fabric-store frontend and Medusa backend for dynamic fabric data management.

## Architecture

```
fabric-store (Next.js)          Medusa Backend
    |                                |
    ├── /lib/fabric-api.ts -------> API Routes
    ├── /hooks/useFabrics.ts          ├── /api/fabrics
    └── React Components              ├── /api/fabric-collections
                                      └── /api/fabric-categories
```

## Setup Instructions

### 1. Database Setup (PostgreSQL on Neon)
Your PostgreSQL database is already configured on Neon. The connection details are in:
- `/backend/.env`
- `/backend/medusa/medusa-backend/.env`

### 2. Start Medusa Backend

#### Option A: Using the startup script
```bash
./scripts/start-medusa-with-fabrics.sh
```

#### Option B: Manual startup
```bash
cd backend/medusa/medusa-backend

# Install dependencies (first time only)
npm install

# Run database migrations
npx medusa db:migrate

# Build the backend
npm run build

# Start the server (port 9000)
npm run dev
```

### 3. Seed Fabric Data (First Time)

```bash
cd backend/medusa/medusa-backend
npx ts-node src/scripts/seed-fabrics.ts
```

Or manually through the API:
```bash
curl -X POST http://localhost:9000/api/fabrics/bulk \
  -H "Content-Type: application/json" \
  -d @frontend/shared/data/fabric-seed.json
```

### 4. Start Fabric Store Frontend

```bash
cd frontend/experiences/fabric-store
npm run dev  # Runs on port 3006
```

### 5. Test the Integration

Visit: http://localhost:3006/test-api

This page will test all API endpoints and show their status.

## Files Created/Modified

### Backend (Medusa)

1. **Models & Entities**
   - `/backend/medusa/medusa-backend/src/models/fabric.ts` - Fabric entity definition
   - `/backend/medusa/medusa-backend/src/migrations/1704123456789-CreateFabricTable.ts` - Database migration

2. **Services**
   - `/backend/medusa/medusa-backend/src/services/fabric.service.ts` - Business logic
   - `/backend/medusa/medusa-backend/src/repositories/fabric.repository.ts` - Data access

3. **API Routes**
   - `/backend/medusa/medusa-backend/src/api/routes/fabrics/index.ts` - RESTful endpoints

4. **Scripts**
   - `/backend/medusa/medusa-backend/src/scripts/seed-fabrics.ts` - Data seeding
   - `/scripts/start-medusa-with-fabrics.sh` - Startup script

### Frontend (Fabric Store)

1. **API Client**
   - `/frontend/experiences/fabric-store/lib/fabric-api.ts` - API client library

2. **React Hooks**
   - `/frontend/experiences/fabric-store/hooks/useFabrics.ts` - Data fetching hooks

3. **Pages**
   - `/frontend/experiences/fabric-store/app/page-api.tsx` - Homepage with API integration
   - `/frontend/experiences/fabric-store/app/test-api/page.tsx` - API testing page

4. **Configuration**
   - `/frontend/experiences/fabric-store/.env.local` - Added NEXT_PUBLIC_MEDUSA_URL

## API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fabrics` | List all fabrics with filters |
| GET | `/api/fabrics/:id` | Get fabric by ID |
| GET | `/api/fabrics/sku/:sku` | Get fabric by SKU |
| GET | `/api/fabrics/search/:query` | Search fabrics |
| GET | `/api/fabric-collections` | Get all collections |
| GET | `/api/fabric-categories` | Get all categories |

### Admin Endpoints (Auth Required - Not Yet Implemented)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fabrics` | Create new fabric |
| PUT | `/api/fabrics/:id` | Update fabric |
| DELETE | `/api/fabrics/:id` | Delete fabric |
| PATCH | `/api/fabrics/sku/:sku/stock` | Update stock |
| POST | `/api/fabrics/bulk` | Bulk create fabrics |

## Query Parameters

### List Fabrics (`/api/fabrics`)
- `category` - Filter by category
- `collection` - Filter by collection
- `color_family` - Filter by color family
- `pattern` - Filter by pattern
- `usage` - Filter by usage (Indoor/Outdoor/Both)
- `in_stock` - Filter by stock status (true/false)
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

## Features

### Current Implementation
✅ Fabric listing with pagination
✅ Filtering by category, collection, color, pattern
✅ Search functionality
✅ Collections display
✅ Categories listing
✅ Fallback to static data when API is offline
✅ Stock management endpoints
✅ Bulk import capability

### Future Enhancements
- [ ] Authentication for admin operations
- [ ] Image upload to Cloudflare R2
- [ ] Real-time stock updates
- [ ] Order management integration
- [ ] Customer swatch request tracking
- [ ] Analytics and reporting

## Troubleshooting

### Issue: API returns 500 error
**Solution**: Check if PostgreSQL is accessible and migrations have run:
```bash
cd backend/medusa/medusa-backend
npx medusa db:migrate
```

### Issue: No data showing
**Solution**: Seed the database:
```bash
cd backend/medusa/medusa-backend
npx ts-node src/scripts/seed-fabrics.ts
```

### Issue: CORS errors
**Solution**: Update medusa-config.js to include your frontend URL:
```javascript
storeCors: "http://localhost:3006"
```

### Issue: Database connection failed
**Solution**: Verify PostgreSQL credentials in `.env` files match your Neon database.

## Development Workflow

1. **Adding New Fabric Fields**
   - Update `/backend/medusa/medusa-backend/src/models/fabric.ts`
   - Create a new migration
   - Update the service and API routes
   - Update frontend types in `/frontend/experiences/fabric-store/lib/fabric-api.ts`

2. **Testing Changes**
   - Use the test page: http://localhost:3006/test-api
   - Check Medusa logs: `cd backend/medusa/medusa-backend && npm run dev`
   - Test with curl: `curl http://localhost:9000/api/fabrics`

3. **Deploying to Production**
   - Deploy Medusa backend to Railway
   - Update frontend environment variables in Vercel
   - Run migrations on production database

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_MEDUSA_URL=http://localhost:9000  # Change to production URL when deployed
```

### Backend (.env)
```env
DATABASE_URL=postgresql://...  # Your Neon PostgreSQL URL
JWT_SECRET=...                 # For authentication
STORE_CORS=http://localhost:3006,https://your-production-url.com
```

## Success Metrics

The integration is successful when:
1. ✅ Fabric data loads from Medusa API
2. ✅ Fallback to static data works when API is offline
3. ✅ All filters and search work correctly
4. ✅ Collections and categories display properly
5. ✅ Test page shows all green checkmarks

## Next Steps

1. Implement authentication for admin operations
2. Add image upload functionality
3. Create admin dashboard for fabric management
4. Set up production deployment pipeline
5. Implement real-time stock tracking

## Support

For issues or questions:
1. Check Medusa logs: `docker logs medusa-backend`
2. Check frontend console for errors
3. Verify database connectivity
4. Test API endpoints with curl or Postman