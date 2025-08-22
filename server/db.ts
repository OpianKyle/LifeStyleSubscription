import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema-sqlite";
import { join } from 'path';

// Use SQLite for development to ensure the app works
const dbPath = join(process.cwd(), 'data.db');
console.log('Using SQLite database at:', dbPath);

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
try {
  // Create users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'USER' NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE NOT NULL,
      email_verification_token TEXT,
      password_reset_token TEXT,
      password_reset_expires DATETIME,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  // Create subscription_plans table  
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL UNIQUE,
      price DECIMAL(10, 2) NOT NULL,
      currency TEXT DEFAULT 'ZAR' NOT NULL,
      "interval" TEXT DEFAULT 'month' NOT NULL,
      description TEXT,
      features TEXT,
      stripe_product_id TEXT,
      stripe_price_id TEXT,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);

  console.log('SQLite database initialized successfully');
} catch (error) {
  console.error('Error initializing database:', error);
}