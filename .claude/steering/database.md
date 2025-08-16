# Database Architecture - Tara Hub

## Database System
- **Provider**: PostgreSQL (via Neon)
- **ORM**: Drizzle ORM with TypeScript
- **Migrations**: Drizzle Kit for schema migrations
- **Connection**: Pooled connections via Neon serverless driver

## Core Schema

### Users Table
```typescript
users {
  id: uuid (primary key)
  email: string (unique)
  name: string
  role: enum('admin', 'user')
  emailVerified: timestamp
  image: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Fabrics Table
```typescript
fabrics {
  id: uuid (primary key)
  name: string
  description: text
  category: string
  subcategory: string
  price: decimal
  weight: decimal
  width: decimal
  composition: string
  care_instructions: text
  in_stock: boolean
  stock_quantity: integer
  images: jsonb (array of image URLs)
  etsy_listing_id: string
  tags: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Content Calendar Table
```typescript
content_calendar {
  id: uuid (primary key)
  user_id: uuid (foreign key -> users)
  platform: enum('instagram', 'facebook', 'pinterest')
  content_type: enum('post', 'story', 'reel')
  title: string
  description: text
  media_urls: jsonb
  scheduled_date: timestamp
  published: boolean
  published_date: timestamp
  engagement_metrics: jsonb
  hashtags: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Orders Table
```typescript
orders {
  id: uuid (primary key)
  customer_email: string
  customer_name: string
  items: jsonb
  total_amount: decimal
  status: enum('pending', 'processing', 'shipped', 'delivered', 'cancelled')
  etsy_order_id: string
  shipping_address: jsonb
  tracking_number: string
  notes: text
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Analytics Table
```typescript
analytics {
  id: uuid (primary key)
  metric_type: string
  metric_value: jsonb
  date: date
  platform: string
  createdAt: timestamp
}
```

## Relationships
- Users -> Content Calendar (one-to-many)
- Users -> Orders (one-to-many)
- Fabrics -> Orders (many-to-many via items jsonb)

## Indexes
- `users_email_idx` on users.email
- `fabrics_category_idx` on fabrics.category
- `content_scheduled_idx` on content_calendar.scheduled_date
- `orders_status_idx` on orders.status
- `analytics_date_idx` on analytics.date

## Migration Strategy
1. Version control all migrations in `/drizzle` directory
2. Use `npm run db:migrate` for applying migrations
3. Use `npm run db:push` for development updates
4. Always backup before production migrations

## Performance Optimizations
- Connection pooling with 20 max connections
- Prepared statements for repeated queries
- JSONB columns for flexible data structures
- Partial indexes for filtered queries
- Query result caching in Redis (future)

## Backup Strategy
- Daily automated backups via Neon
- Point-in-time recovery up to 7 days
- Weekly exports to S3 for long-term storage

## Security
- Row-level security (RLS) policies
- Encrypted connections (SSL/TLS)
- Parameterized queries via Drizzle ORM
- No direct SQL execution
- Sensitive data encryption at rest