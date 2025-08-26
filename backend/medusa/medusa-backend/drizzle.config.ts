import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.local' });

export default {
  // Schema files location for additional Drizzle schemas (if needed later)
  schema: [
    './src/drizzle-schemas/*.schema.ts'
  ],
  
  // Output directory for migrations
  out: './drizzle',
  
  // Database dialect
  dialect: 'postgresql',
  
  // Database credentials (shared with main app)
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  },
  
  // Additional options
  verbose: true,
  strict: true,
  
  // Use public schema (Medusa uses TypeORM migrations)
  schemaFilter: ['public'],
} satisfies Config;