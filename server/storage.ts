import { 
  users, 
  subscriptionPlans, 
  subscriptions, 
  invoices,
  extendedCover,
  type User, 
  type InsertUser,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type InsertSubscription,
  type Invoice,
  type InsertInvoice,
  type ExtendedCover,
  type InsertExtendedCover
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
  
  // Extended cover operations
  createExtendedCover(cover: InsertExtendedCover): Promise<ExtendedCover>;
  getUserExtendedCover(userId: string): Promise<ExtendedCover[]>;
  updateExtendedCover(id: string, cover: Partial<ExtendedCover>): Promise<ExtendedCover | undefined>;
  deleteExtendedCover(id: string): Promise<void>;
  
  // Full subscription operations
  createFullSubscription(subscriptionData: any): Promise<Subscription>;
  
  // Admin operations
  getAllUsers(): Promise<(User & { subscription?: Subscription & { plan: SubscriptionPlan } })[]>;
  getSubscriptionStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(insertUser: InsertUser): Promise<User> {
    await db
      .insert(users)
      .values(insertUser);
    
    // Get the inserted user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, insertUser.email));
    return user!;
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
    await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id));
    
    // Get the updated user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async verifyUserEmail(token: string): Promise<User | undefined> {
    await db
      .update(users)
      .set({ 
        emailVerified: true, 
        emailVerificationToken: null,
        updatedAt: new Date()
      })
      .where(eq(users.emailVerificationToken, token));
    
    // Get the updated user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token));
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
    await db
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
      ));
    
    // Get the updated user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token));
    return user;
  }

  // Subscription plan operations
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    await db
      .insert(subscriptionPlans)
      .values(plan);
    
    // Get the inserted plan
    const [newPlan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.planName, plan.planName as any));
    return newPlan!;
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
      .where(eq(subscriptionPlans.planName, name as any));
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
    await db
      .update(subscriptionPlans)
      .set(planData)
      .where(eq(subscriptionPlans.id, id));
    
    // Get the updated plan
    const [updatedPlan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return updatedPlan;
  }

  // Subscription operations
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    await db
      .insert(subscriptions)
      .values(subscription);
    
    // Get the inserted subscription
    const [newSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, subscription.userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return newSubscription!;
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
    await db
      .update(subscriptions)
      .set({ ...subscriptionData, updatedAt: new Date() })
      .where(eq(subscriptions.id, id));
    
    // Get the updated subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  async cancelSubscription(id: string): Promise<Subscription | undefined> {
    await db
      .update(subscriptions)
      .set({ 
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id));
    
    // Get the updated subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
    return subscription;
  }

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    await db
      .insert(invoices)
      .values(invoice);
    
    // Get the inserted invoice
    const [newInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, invoice.userId))
      .orderBy(desc(invoices.createdAt))
      .limit(1);
    return newInvoice!;
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

  // Extended cover operations
  async createExtendedCover(cover: InsertExtendedCover): Promise<ExtendedCover> {
    await db
      .insert(extendedCover)
      .values(cover);
    
    // Get the inserted cover
    const [newCover] = await db
      .select()
      .from(extendedCover)
      .where(eq(extendedCover.userId, cover.userId))
      .orderBy(desc(extendedCover.createdAt))
      .limit(1);
    return newCover!;
  }

  async getUserExtendedCover(userId: string): Promise<ExtendedCover[]> {
    return await db
      .select()
      .from(extendedCover)
      .where(and(eq(extendedCover.userId, userId), eq(extendedCover.isActive, true)))
      .orderBy(desc(extendedCover.createdAt));
  }

  async updateExtendedCover(id: string, coverData: Partial<ExtendedCover>): Promise<ExtendedCover | undefined> {
    await db
      .update(extendedCover)
      .set({ ...coverData, updatedAt: new Date() })
      .where(eq(extendedCover.id, id));
    
    // Get the updated cover
    const [cover] = await db
      .select()
      .from(extendedCover)
      .where(eq(extendedCover.id, id));
    return cover;
  }

  async deleteExtendedCover(id: string): Promise<void> {
    await db
      .update(extendedCover)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(extendedCover.id, id));
  }

  // Full subscription operations
  async createFullSubscription(subscriptionData: any): Promise<Subscription> {
    // Create basic subscription record
    const insertData = {
      userId: subscriptionData.userId,
      planId: subscriptionData.planId,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      stripeCustomerId: subscriptionData.stripeCustomerId,
      status: subscriptionData.status,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    await db
      .insert(subscriptions)
      .values(insertData);
    
    // Get the inserted subscription
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, insertData.userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    
    return subscription!;
  }
}

export const storage = new DatabaseStorage();
