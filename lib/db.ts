import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './auth-schema';

// Only initialize database if DATABASE_URL is provided
// This allows the app to run without a database for non-auth features
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
}

export { db };