import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";

// For development, use a default database URL if not set
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://runner@/main?host=/tmp/run';

if (!DATABASE_URL.startsWith('postgresql://') && !DATABASE_URL.startsWith('postgres://')) {
  throw new Error(
    "DATABASE_URL must be a valid PostgreSQL connection string. Example: postgresql://user:password@localhost:5432/dbname",
  );
}

console.log('Connecting to database...');

export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = drizzle({ client: pool, schema });

// Test the connection
pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});