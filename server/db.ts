import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

// MySQL connection configuration
const MYSQL_CONFIG = {
  host: 'dedi1350.jnb1.host-h.net',
  port: 3306,
  user: 'lifes',
  password: '1S021z2A440Pj7',
  database: 'lifestylerewards',
  ssl: {
    rejectUnauthorized: false // Required for Xneelo SSL
  },
  charset: 'utf8mb4'
};

console.log('Connecting to MySQL database...');

// Create MySQL connection pool
export const pool = mysql.createPool(MYSQL_CONFIG);

export const db = drizzle(pool, { schema, mode: 'default' });

// Test the connection and create tables if they don't exist
pool.getConnection()
  .then(async (connection) => {
    console.log('Connected to MySQL database');
    
    // Create tables if they don't exist
    try {
      await createTablesIfNotExist(connection);
      console.log('Database tables verified/created');
    } catch (error) {
      console.error('Error creating tables:', error);
    }
    
    connection.release();
  })
  .catch((err) => {
    console.error('MySQL connection error:', err);
  });

// Function to create tables if they don't exist
async function createTablesIfNotExist(connection: mysql.PoolConnection) {
  const createTablesSQL = `
    -- Create enums as tables for MySQL compatibility
    CREATE TABLE IF NOT EXISTS user_role_enum (
      value VARCHAR(10) PRIMARY KEY
    );
    
    CREATE TABLE IF NOT EXISTS subscription_status_enum (
      value VARCHAR(20) PRIMARY KEY
    );
    
    CREATE TABLE IF NOT EXISTS plan_name_enum (
      value VARCHAR(20) PRIMARY KEY
    );
    
    CREATE TABLE IF NOT EXISTS family_relation_enum (
      value VARCHAR(20) PRIMARY KEY
    );
    
    -- Insert enum values if they don't exist
    INSERT IGNORE INTO user_role_enum (value) VALUES ('USER'), ('ADMIN');
    INSERT IGNORE INTO subscription_status_enum (value) VALUES ('ACTIVE'), ('CANCELED'), ('PAST_DUE'), ('INCOMPLETE');
    INSERT IGNORE INTO plan_name_enum (value) VALUES ('OPPORTUNITY'), ('MOMENTUM'), ('PROSPER'), ('PRESTIGE'), ('PINNACLE');
    INSERT IGNORE INTO family_relation_enum (value) VALUES ('SPOUSE'), ('CHILD'), ('PARENT'), ('EXTENDED_FAMILY');
    
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      email VARCHAR(255) NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      role ENUM('USER', 'ADMIN') DEFAULT 'USER' NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE NOT NULL,
      email_verification_token VARCHAR(255),
      password_reset_token VARCHAR(255),
      password_reset_expires TIMESTAMP NULL,
      stripe_customer_id VARCHAR(255),
      stripe_subscription_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    );
    
    -- Subscription plans table
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      plan_name ENUM('OPPORTUNITY', 'MOMENTUM', 'PROSPER', 'PRESTIGE', 'PINNACLE') NOT NULL UNIQUE,
      price DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'ZAR' NOT NULL,
      \`interval\` VARCHAR(20) DEFAULT 'month' NOT NULL,
      description TEXT,
      features JSON,
      stripe_product_id VARCHAR(255),
      stripe_price_id VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    
    -- Subscriptions table
    CREATE TABLE IF NOT EXISTS subscriptions (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      plan_id VARCHAR(36) NOT NULL,
      stripe_subscription_id VARCHAR(255) UNIQUE,
      status ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'INCOMPLETE') DEFAULT 'ACTIVE' NOT NULL,
      current_period_start TIMESTAMP NULL,
      current_period_end TIMESTAMP NULL,
      cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL,
      canceled_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
    );
    
    -- Invoices table
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      subscription_id VARCHAR(36),
      stripe_invoice_id VARCHAR(255) UNIQUE,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'ZAR' NOT NULL,
      status VARCHAR(20) NOT NULL,
      paid_at TIMESTAMP NULL,
      due_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    );
    
    -- Extended cover table
    CREATE TABLE IF NOT EXISTS extended_cover (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      surname VARCHAR(255) NOT NULL,
      id_number VARCHAR(13),
      date_of_birth VARCHAR(10),
      age INT NOT NULL,
      relation ENUM('SPOUSE', 'CHILD', 'PARENT', 'EXTENDED_FAMILY') NOT NULL,
      cover_amount DECIMAL(10, 2) NOT NULL,
      monthly_premium DECIMAL(10, 2) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;
  
  const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await connection.execute(statement);
      } catch (error) {
        console.error('Error executing statement:', statement, error);
      }
    }
  }
}