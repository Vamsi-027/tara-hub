import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export default {
  // Schema files location
  schema: [
    './lib/auth-schema.ts',
    './lib/db/schema/*.schema.ts'
  ],
  
  // Output directory for migrations
  out: './drizzle',
  
  // Database dialect
  dialect: 'postgresql',
  
  // Database credentials
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  },
  
  // Additional options
  verbose: true,
  strict: true,
  
  // Table filter (optional - include all tables)
  tablesFilter: ['*'],
  
  // Schema filter (optional - use public schema)
  schemaFilter: ['public'],
} satisfies Config;
