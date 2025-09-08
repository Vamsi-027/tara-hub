/**
 * Drizzle Database Connection
 * Infrastructure layer - database connection management
 * Single Responsibility: PostgreSQL connection configuration
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export type DrizzleDb = ReturnType<typeof drizzle>;

let dbInstance: DrizzleDb | null = null;

export function drizzleConnection(databaseUrl?: string): DrizzleDb {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = databaseUrl || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    throw new Error('Database connection string is required');
  }

  const queryClient = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10
  });

  dbInstance = drizzle(queryClient);
  
  return dbInstance;
}

export function closeConnection(): void {
  if (dbInstance) {
    dbInstance = null;
  }
}