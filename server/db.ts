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
      adumo_customer_id VARCHAR(255),
      adumo_subscription_id VARCHAR(255),
      phone_number VARCHAR(20) NULL,
      billing_address TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    );
    
    -- Handle subscription plans table (check if needs fixing)
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      name ENUM('OPPORTUNITY', 'MOMENTUM', 'PROSPER', 'PRESTIGE', 'PINNACLE') NOT NULL UNIQUE,
      price DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'ZAR' NOT NULL,
      \`interval\` VARCHAR(20) DEFAULT 'month' NOT NULL,
      description TEXT,
      features JSON,
      adumo_product_id VARCHAR(255),
      adumo_price_id VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    
    -- Subscriptions table
    CREATE TABLE IF NOT EXISTS subscriptions (
      id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id VARCHAR(36) NOT NULL,
      plan_id VARCHAR(36) NOT NULL,
      adumo_subscription_id VARCHAR(255) UNIQUE,
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
      adumo_invoice_id VARCHAR(255) UNIQUE,
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
  
  // Check if subscription_plans table exists with wrong column structure
  try {
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'lifestylerewards' 
      AND TABLE_NAME = 'subscription_plans' 
      AND COLUMN_NAME = 'plan_name'
    `) as any;
    
    // If table has wrong column, fix it by disabling FK checks and dropping/recreating
    if (Array.isArray(columns) && columns.length > 0) {
      console.log('Fixing subscription_plans table structure...');
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      await connection.execute('DROP TABLE IF EXISTS invoices');
      await connection.execute('DROP TABLE IF EXISTS subscriptions'); 
      await connection.execute('DROP TABLE IF EXISTS extended_cover');
      await connection.execute('DROP TABLE IF EXISTS subscription_plans');
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    }
  } catch (error) {
    console.log('Checking table structure...');
  }
  
  const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await connection.execute(statement);
      } catch (error: any) {
        if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
          console.error('Error executing statement:', statement, error);
        }
      }
    }
  }
  
  // Add missing columns to existing tables using safe column checks
  try {
    // Check and add missing columns to users table
    const [phoneColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'phone_number'
    `) as any;
    
    if (!Array.isArray(phoneColumns) || phoneColumns.length === 0) {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN phone_number VARCHAR(20) NULL
      `);
      console.log('Added phone_number column to users table');
    }
    
    const [billingColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'billing_address'
    `) as any;
    
    if (!Array.isArray(billingColumns) || billingColumns.length === 0) {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN billing_address TEXT NULL
      `);
      console.log('Added billing_address column to users table');
    }

    // Check and add adumo columns if they don't exist
    const columnsToCheck = [
      { table: 'users', column: 'adumo_customer_id', type: 'VARCHAR(255)' },
      { table: 'users', column: 'adumo_subscription_id', type: 'VARCHAR(255)' },
      { table: 'subscription_plans', column: 'adumo_product_id', type: 'VARCHAR(255)' },
      { table: 'subscription_plans', column: 'adumo_price_id', type: 'VARCHAR(255)' },
      { table: 'subscriptions', column: 'adumo_subscription_id', type: 'VARCHAR(255)' },
      { table: 'invoices', column: 'adumo_invoice_id', type: 'VARCHAR(255)' }
    ];
    
    for (const { table, column, type } of columnsToCheck) {
      const [existing] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = ?
      `, [table, column]) as any;
      
      if (!Array.isArray(existing) || existing.length === 0) {
        await connection.execute(`
          ALTER TABLE ${table} ADD COLUMN ${column} ${type} NULL
        `);
        console.log(`Added ${column} column to ${table} table`);
      }
    }
    
    console.log('Table columns updated successfully');
  } catch (error: any) {
    console.error('Error updating table columns:', error);
  }
  
  console.log('All tables verified/created successfully');
}