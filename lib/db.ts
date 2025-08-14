import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './auth-schema';

// Only initialize database if DATABASE_URL is provided
// This allows the app to run without a database for non-auth features
let db: ReturnType<typeof drizzle> | null = null;

// Use POSTGRES_URL from Neon (or fallback to DATABASE_URL)
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (databaseUrl) {
  const sql = neon(databaseUrl);
  db = drizzle(sql, { schema });
}

export { db };