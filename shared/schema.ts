import { sql } from "drizzle-orm";
import { 
  mysqlTable, 
  text, 
  varchar, 
  int, 
  decimal, 
  timestamp, 
  boolean,
  mysqlEnum
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = mysqlEnum('role', ['USER', 'ADMIN']);
export const subscriptionStatusEnum = mysqlEnum('status', ['ACTIVE', 'CANCELED', 'PAST_DUE', 'INCOMPLETE']);
export const planNameEnum = mysqlEnum('name', ['OPPORTUNITY', 'MOMENTUM', 'PROSPER', 'PRESTIGE', 'PINNACLE']);
export const familyRelationEnum = mysqlEnum('relation', ['SPOUSE', 'CHILD', 'PARENT', 'EXTENDED_FAMILY']);
export const transactionStatusEnum = mysqlEnum('transaction_status', ['PENDING', 'SUCCESS', 'FAILED']);
export const gatewayEnum = mysqlEnum('gateway', ['ADUMO', 'STRIPE', 'OTHER']);

// Users table
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum.default('USER').notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),
  adumoCustomerId: varchar("adumo_customer_id", { length: 255 }),
  adumoSubscriptionId: varchar("adumo_subscription_id", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  billingAddress: text("billing_address"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// Subscription plans table
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  name: planNameEnum.notNull().unique(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('ZAR').notNull(),
  interval: varchar("interval", { length: 20 }).default('month').notNull(),
  description: text("description"),
  features: text("features"), // Store JSON string
  adumoProductId: varchar("adumo_product_id", { length: 255 }),
  adumoPriceId: varchar("adumo_price_id", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Subscriptions table
export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  planId: varchar("plan_id", { length: 36 }).references(() => subscriptionPlans.id).notNull(),
  adumoSubscriptionId: varchar("adumo_subscription_id", { length: 255 }).unique(),
  status: subscriptionStatusEnum.default('ACTIVE').notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// Invoices table - simplified, gateway-agnostic
export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  subscriptionId: varchar("subscription_id", { length: 36 }).references(() => subscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('ZAR').notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Transactions table - tracks all payment attempts for any gateway
export const transactions = mysqlTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  invoiceId: varchar("invoice_id", { length: 36 }).references(() => invoices.id).notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  
  // Core gateway fields
  merchantReference: varchar("merchant_reference", { length: 255 }).notNull().unique(),
  adumoTransactionId: varchar("adumo_transaction_id", { length: 255 }).unique(),
  adumoStatus: transactionStatusEnum.default('PENDING').notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  gateway: gatewayEnum.default('ADUMO').notNull(),
  
  // Financials
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('ZAR').notNull(),
  
  // Optional logging for audit trail
  requestPayload: text("request_payload"),
  responsePayload: text("response_payload"),
  notifyUrlResponse: text("notify_url_response"),
  
  // Audit
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  // Index for performance on common queries
  invoiceIdIdx: index("idx_transactions_invoice_id").on(table.invoiceId),
  userIdIdx: index("idx_transactions_user_id").on(table.userId),
}));

// Extended cover table for additional family members
export const extendedCover = mysqlTable("extended_cover", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("user_id", { length: 36 }).references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  surname: varchar("surname", { length: 255 }).notNull(),
  idNumber: varchar("id_number", { length: 13 }),
  dateOfBirth: varchar("date_of_birth", { length: 10 }),
  age: int("age").notNull(),
  relation: familyRelationEnum.notNull(),
  coverAmount: decimal("cover_amount", { precision: 10, scale: 2 }).notNull(),
  monthlyPremium: decimal("monthly_premium", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  invoices: many(invoices),
  transactions: many(transactions),
  extendedCover: many(extendedCover),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
  plan: one(subscriptionPlans, { fields: [subscriptions.planId], references: [subscriptionPlans.id] }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, { fields: [invoices.userId], references: [users.id] }),
  subscription: one(subscriptions, { fields: [invoices.subscriptionId], references: [subscriptions.id] }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  invoice: one(invoices, { fields: [transactions.invoiceId], references: [invoices.id] }),
}));

export const extendedCoverRelations = relations(extendedCover, ({ one }) => ({
  user: one(users, { fields: [extendedCover.userId], references: [users.id] }),
}));

// Schema types - using basic insert schemas for MySQL compatibility
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertExtendedCoverSchema = createInsertSchema(extendedCover).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type ExtendedCover = typeof extendedCover.$inferSelect;
export type InsertExtendedCover = z.infer<typeof insertExtendedCoverSchema>;
