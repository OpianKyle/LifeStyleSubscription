import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AuthService } from "./services/auth";
import { StripeService } from "./services/stripe";
import { z } from "zod";
import Stripe from 'stripe';

// Authentication middleware
const authenticateToken = async (req: any, res: Response, next: NextFunction) => {
  // Try to get token from Authorization header first, then from cookies
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.split(' ')[1];
  const cookieToken = req.cookies?.accessToken;
  
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = AuthService.verifyToken(token);
    const user = await storage.getUserById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Admin middleware
const requireAdmin = (req: any, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const createSubscriptionSchema = z.object({
  planName: z.enum(['OPPORTUNITY', 'MOMENTUM', 'PROSPER', 'PRESTIGE', 'PINNACLE'])
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize subscription plans
  const plans = [
    {
      name: 'OPPORTUNITY' as const,
      price: '350.00',
      description: 'Essential protection for everyday life',
      features: ['EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Funeral Cover', 'Accidental Death Cover', 'Funeral Assist', 'Family Income Benefit', 'Lawyer Assist', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services']
    },
    {
      name: 'MOMENTUM' as const,
      price: '450.00',
      description: 'Enhanced protection with increased coverage',
      features: ['Funeral Cover: R5,000', 'Funeral Assist', 'EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Accidental Death Cover', 'Family Income Benefit', 'Lawyer Assist', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services']
    },
    {
      name: 'PROSPER' as const,
      price: '550.00',
      description: 'Comprehensive protection for growing families',
      features: ['Funeral Cover: R10,000', 'Accidental Death Cover: R20,000', 'Funeral Assist', 'Family Income Benefit: R5,000 x6', 'EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Virtual GP Assistant', 'Medical Second Opinion', 'Lawyer Assist', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services']
    },
    {
      name: 'PRESTIGE' as const,
      price: '695.00',
      description: 'Premium protection with superior benefits',
      features: ['Funeral Cover: R15,000', 'Accidental Death Cover: R50,000', 'Funeral Assist', 'Family Income Benefit: R5,000 x6', 'EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services', 'Lawyer Assist']
    },
    {
      name: 'PINNACLE' as const,
      price: '825.00',
      description: 'Ultimate protection with maximum coverage',
      features: ['Funeral Cover: R20,000', 'Accidental Death Cover: R100,000', 'Funeral Assist', 'Family Income Benefit: R5,000 x6', 'EMS Assist', 'Legal Assist', 'Lawyer Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services']
    }
  ];

  // Initialize plans in database
  for (const planData of plans) {
    try {
      const existingPlan = await storage.getSubscriptionPlanByName(planData.name);
      if (!existingPlan) {
        await storage.createSubscriptionPlan(planData);
      }
    } catch (error) {
      console.error(`Error creating plan ${planData.name}:`, error);
    }
  }

  // Auth routes
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { email, password, name } = registerSchema.parse(req.body);
      const result = await AuthService.register(email, password, name);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(email, password);
      
      // Set httpOnly cookies
      res.cookie('accessToken', result.tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({ user: result.user, tokens: result.tokens });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const user = await AuthService.verifyEmail(token);
      res.json({ message: 'Email verified successfully', user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/request-password-reset', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const result = await AuthService.requestPasswordReset(email);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      const user = await AuthService.resetPassword(token, password);
      res.json({ message: 'Password reset successful', user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/auth/user', authenticateToken, async (req: any, res: Response) => {
    res.json(req.user);
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  });

  // Subscription plan routes
  app.get('/api/plans', async (_req: Request, res: Response) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json({ plans });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Subscription routes
  app.post('/api/subscriptions/create', authenticateToken, async (req: any, res: Response) => {
    try {
      const { planName } = createSubscriptionSchema.parse(req.body);
      const result = await StripeService.createSubscription(req.user.id, planName);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/subscriptions/current', authenticateToken, async (req: any, res: Response) => {
    try {
      const subscription = await storage.getUserSubscription(req.user.id);
      res.json({ subscription });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/subscriptions/update', authenticateToken, async (req: any, res: Response) => {
    try {
      const { planName } = createSubscriptionSchema.parse(req.body);
      const result = await StripeService.updateSubscription(req.user.id, planName);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/subscriptions/cancel', authenticateToken, async (req: any, res: Response) => {
    try {
      const result = await StripeService.cancelSubscription(req.user.id);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Invoice routes
  app.get('/api/invoices', authenticateToken, async (req: any, res: Response) => {
    try {
      const invoices = await storage.getUserInvoices(req.user.id);
      res.json({ invoices });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Manual email verification route (temporary workaround)
  app.post('/api/auth/manual-verify', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updatedUser = await storage.updateUser(user.id, { emailVerified: true });
      res.json({ message: 'Email verified successfully', user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get('/api/admin/users', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json({ users });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/admin/stats', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getSubscriptionStats();
      res.json({ stats });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe webhook
  app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(400).json({ message: 'Webhook secret not configured' });
    }

    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      
      await StripeService.handleWebhook(event);
      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ message: `Webhook Error: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
