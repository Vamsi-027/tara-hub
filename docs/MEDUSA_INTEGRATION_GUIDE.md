# Medusa.js Integration Guide - Tara Hub

This guide provides step-by-step instructions for integrating Medusa.js with the Tara Hub fabric marketplace using the hybrid multi-tenant architecture with Drizzle ORM.

## Architecture Overview

```
tara-hub/
├── medusa-backend/                 # Medusa commerce backend
│   ├── src/
│   │   ├── schemas/               # Drizzle ORM schemas
│   │   ├── services/              # Multi-tenant services
│   │   └── lib/                   # Database client
│   ├── medusa-config.js           # Medusa configuration
│   └── package.json               # Dependencies
├── app/api/commerce/              # API bridge routes
├── experiences/fabric-store/      # Frontend using Medusa
└── middleware.ts                  # Tenant resolution
```

## Prerequisites

1. **Existing Setup**: Ensure you have the Tara Hub monorepo running
2. **PostgreSQL Database**: Must be accessible (existing Neon DB works)
3. **Node.js**: Version 18+ (already configured in your project)
4. **Environment Variables**: See configuration section below

## Installation Steps

### 1. Install Dependencies

From the root directory:

```bash
# Install all workspace dependencies including new Medusa backend
npm install

# Install Medusa backend dependencies specifically
cd medusa-backend && npm install
```

### 2. Environment Configuration

Add to your `.env.local` file (or `env/.env.local`):

```env
# Medusa Backend Configuration
MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_PORT=9000

# Commerce API
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Existing variables (already configured)
DATABASE_URL=your_postgresql_url
NEXTAUTH_SECRET=your_jwt_secret
```

### 3. Database Setup

The integration uses your existing PostgreSQL database with additional schemas:

```bash
# Generate and run Drizzle migrations for Medusa schemas
cd medusa-backend
npm run db:generate
npm run db:push

# View database in Drizzle Studio
npm run db:studio
```

### 4. Start the Development Environment

```bash
# From root directory - starts all apps including Medusa
npm run dev

# Or start individually:
npm run dev:admin        # Admin app (port 3000)
cd medusa-backend && npm run dev  # Medusa backend (port 9000)
cd experiences/fabric-store && npm run dev  # Fabric store (port 3006)
```

### 5. Seed Initial Data

Create a default tenant and import existing fabric data:

```bash
# Access the admin API to seed initial tenant
curl -X POST http://localhost:3000/api/__tests__/seed-admin

# Or use the Medusa admin panel
open http://localhost:9000/admin
```

## API Structure

### Commerce API Endpoints (`/api/commerce/`)

#### Products
- `GET /api/commerce/products` - List products with filters
- `GET /api/commerce/products/[id]` - Get single product
- `POST /api/commerce/products` - Create product (admin only)

#### Cart Management
- `POST /api/commerce/cart` - Create new cart
- `GET /api/commerce/cart?cartId=xxx` - Get cart by ID
- `POST /api/commerce/cart/items` - Add item to cart
- `PATCH /api/commerce/cart/items` - Update cart item
- `DELETE /api/commerce/cart/items` - Remove cart item

### Medusa Backend Endpoints (port 9000)

- `http://localhost:9000/admin` - Admin dashboard
- `http://localhost:9000/store/products` - Store API
- `http://localhost:9000/store/carts` - Cart API

## Multi-Tenant Configuration

### Tenant Resolution

The middleware automatically resolves tenants based on:

1. **Port-based** (development):
   - Port 3006 → `fabric-store` tenant
   - Port 3007 → `store-guide` tenant
   - Port 3000 → `default` tenant

2. **Domain-based** (production):
   - `customer.tara-hub.com` → `customer` tenant
   - `customerdomain.com` → resolved from database

### Adding New Tenants

```typescript
// Example: Create new tenant via API
const tenant = await tenantService.createTenant({
  name: 'Customer Store',
  domain: 'customer.com',
  subdomain: 'customer',
  storeName: 'Customer Fabric Store',
  email: 'admin@customer.com',
  settings: {
    features: { enableSamples: true },
    branding: { primaryColor: '#000000' }
  }
});
```

## Usage in Fabric Store

### Using Medusa Hooks

```typescript
// experiences/fabric-store/components/ProductList.tsx
import { useProducts, useCart } from '../hooks/useMedusa';

export default function ProductList() {
  const { products, loading, error } = useProducts({
    limit: 20,
    fabricType: 'cotton'
  });
  
  const { addToCart } = useCart();
  
  const handleAddSample = async (productId: string) => {
    await addToCart(productId, 1, true); // isSample = true
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <button onClick={() => handleAddSample(product.id)}>
            Add Sample (${product.samplePrice})
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Cart Integration

```typescript
// experiences/fabric-store/components/SampleCart.tsx
import { useCart } from '../hooks/useMedusa';

export default function SampleCart() {
  const { cart, removeFromCart, loading } = useCart();
  
  if (!cart || cart.items.length === 0) {
    return <div>Your sample cart is empty</div>;
  }

  return (
    <div>
      <h3>Sample Cart ({cart.itemCount} items)</h3>
      {cart.items.map(item => (
        <div key={item.id}>
          <span>{item.product.name}</span>
          <span>${item.product.samplePrice}</span>
          <button onClick={() => removeFromCart(item.id)}>
            Remove
          </button>
        </div>
      ))}
      <div>Total: ${cart.total}</div>
    </div>
  );
}
```

## Data Migration

### Import Existing Fabric Data

```typescript
// Create migration script
const productService = new ProductService('default');

// Import from existing fabric data
const fabricData = await import('@/modules/fabrics/data/seed-data');
await productService.importFromFabricData(fabricData.default);
```

## Testing the Integration

### 1. Test Product Listing

```bash
# Test API bridge
curl "http://localhost:3000/api/commerce/products?limit=5"

# Test with tenant header
curl -H "x-tenant-id: fabric-store" "http://localhost:3000/api/commerce/products"
```

### 2. Test Cart Functionality

```bash
# Create cart
curl -X POST http://localhost:3000/api/commerce/cart \
  -H "Content-Type: application/json" \
  -d '{"type": "sample"}'

# Add item to cart
curl -X POST http://localhost:3000/api/commerce/cart/items \
  -H "Content-Type: application/json" \
  -d '{"cartId": "cart_xxx", "productId": "prod_xxx", "quantity": 1, "isSample": true}'
```

### 3. Test Frontend Integration

1. Navigate to `http://localhost:3006` (fabric-store)
2. Browse products (should load from Medusa)
3. Add samples to cart
4. Verify cart persistence across page reloads

## Performance Optimization

### Caching Strategy

```typescript
// The system uses multiple cache layers:
// 1. Vercel KV for frequently accessed data
// 2. Medusa Redis cache for sessions
// 3. In-memory fallback for development
```

### Database Optimization

```sql
-- Key indexes already created:
-- - tenant_id indexes on all tables
-- - compound indexes for tenant+handle lookups
-- - product search indexes
```

## Deployment Considerations

### Environment Variables for Production

```env
# Production Medusa Backend
MEDUSA_BACKEND_URL=http://localhost:9000

# Enable Redis caching
KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token

# Production database
DATABASE_URL=your_production_postgres_url
```

### Scaling Strategy

1. **Single Medusa Instance**: Start with one backend for all tenants
2. **Horizontal Scaling**: Add read replicas when needed
3. **Data Partitioning**: Implement tenant-based sharding at 100+ customers
4. **Microservices**: Split heavy operations to separate services

## Troubleshooting

### Common Issues

1. **Port Conflicts**:
   ```bash
   # Kill processes on Medusa port
   npx kill-port 9000
   ```

2. **Database Connection**:
   ```bash
   # Test database connection
   npm run db:studio
   ```

3. **API Bridge Errors**:
   ```bash
   # Check logs in browser dev tools
   # Verify MEDUSA_BACKEND_URL is correct
   ```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=medusa:* npm run dev
```

## Next Steps

1. **Implement Payment Processing**: Add Stripe/PayPal integration
2. **Order Management**: Build order fulfillment workflow
3. **Admin Features**: Extend admin panel for multi-tenant management
4. **Analytics**: Add tenant-specific analytics
5. **Mobile App**: Use Medusa Store API for mobile integration

## Production Readiness Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis/KV caching enabled
- [ ] SSL certificates installed
- [ ] Monitoring setup (error tracking, performance)
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security audit performed

This integration provides a solid foundation for scaling your fabric marketplace while maintaining the flexibility to onboard multiple customers in the future.