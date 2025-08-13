import { 
  users, 
  subscriptionPlans, 
  subscriptions, 
  invoices,
  type User, 
  type InsertUser,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type InsertSubscription,
  type Invoice,
  type InsertInvoice
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  verifyUserEmail(token: string): Promise<User | undefined>;
  setPasswordResetToken(email: string, token: string, expires: Date): Promise<void>;
  resetPassword(token: string, password: string): Promise<User | undefined>;
  
  // Subscription plan operations
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlanByName(name: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionById(id: string): Promise<Subscription | undefined>;
  getUserSubscription(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined>;
  updateSubscription(id: string, subscription: Partial<Subscription>): Promise<Subscription | undefined>;
  cancelSubscription(id: string): Promise<Subscription | undefined>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getUserInvoices(userId: string): Promise<Invoice[]>;
  
  // Admin operations
  getAllUsers(): Promise<(User & { subscription?: Subscription & { plan: SubscriptionPlan } })[]>;
  getSubscriptionStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async verifyUserEmail(token: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        emailVerified: true, 
        emailVerificationToken: null,
        updatedAt: new Date()
      })
      .where(eq(users.emailVerificationToken, token))
      .returning();
    return user;
  }

  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<void> {
    await db
      .update(users)
      .set({ 
        passwordResetToken: token, 
        passwordResetExpires: expires,
        updatedAt: new Date()
      })
      .where(eq(users.email, email));
  }

  async resetPassword(token: string, password: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        password, 
        passwordResetToken: null, 
        passwordResetExpires: null,
        updatedAt: new Date()
      })
      .where(and(
        eq(users.passwordResetToken, token),
        sql`password_reset_expires > NOW()`
      ))
      .returning();
    return user;
  }

  // Subscription plan operations
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan;
  }

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.price);
  }

  async getSubscriptionPlanByName(name: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, name as any));
    return plan;
  }

  async getSubscriptionPlanById(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async updateSubscriptionPlan(id: string, planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set(planData)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan;
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values(subscription)
      .returning();
    return newSubscription;
  }

  async getSubscriptionById(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async getUserSubscription(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | undefined> {
    const [result] = await db
      .select()
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    
    if (!result) return undefined;
    
    return {
      ...result.subscriptions,
      plan: result.subscription_plans
    };
  }

  async updateSubscription(id: string, subscriptionData: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...subscriptionData, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async cancelSubscription(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ 
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getUserInvoices(userId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));
  }

  // Admin operations
  async getAllUsers(): Promise<(User & { subscription?: Subscription & { plan: SubscriptionPlan } })[]> {
    const usersWithSubscriptions = await db
      .select()
      .from(users)
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .orderBy(desc(users.createdAt));

    return usersWithSubscriptions.map(row => ({
      ...row.users,
      subscription: row.subscriptions ? {
        ...row.subscriptions,
        plan: row.subscription_plans!
      } : undefined
    }));
  }

  async getSubscriptionStats(): Promise<any> {
    const totalSubscribers = await db
      .select({ count: sql`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'ACTIVE'));

    const totalRevenue = await db
      .select({ sum: sql`sum(amount)` })
      .from(invoices)
      .where(eq(invoices.status, 'paid'));

    return {
      totalSubscribers: totalSubscribers[0]?.count || 0,
      totalRevenue: totalRevenue[0]?.sum || 0
    };
  }
}

export const storage = new DatabaseStorage();
