import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { AuthService } from "./services/auth";
import { AdumoService } from "./services/adumo";
import { z } from "zod";
import nodemailer from 'nodemailer';

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

const createExtendedCoverSchema = z.object({
  name: z.string().min(2),
  surname: z.string().min(2),
  idNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  age: z.number().min(0).max(120),
  relation: z.enum(['SPOUSE', 'CHILD', 'PARENT', 'EXTENDED_FAMILY']),
  coverAmount: z.number().min(1000)
});

// Premium calculation function based on the provided tables
function calculatePremium(age: number, relation: string, coverAmount: number): number {
  const coverPer1000 = coverAmount / 1000;
  
  // Single Funeral Cover rates (main member and spouse)
  if (relation === 'SPOUSE') {
    if (age >= 18 && age <= 45) return coverPer1000 * 2.55;
    if (age >= 46 && age <= 50) return coverPer1000 * 2.95;
    if (age >= 51 && age <= 60) return coverPer1000 * 3.55;
    if (age >= 61 && age <= 70) return coverPer1000 * 3.55;
  }
  
  // Children rates (0-20)
  if (relation === 'CHILD') {
    if (age >= 0 && age <= 5) return coverPer1000 * 1.95;
    if (age >= 6 && age <= 13) return coverPer1000 * 2.05;
    if (age >= 14 && age <= 20) return coverPer1000 * 2.25;
  }
  
  // Parent funeral benefit (up to 75)
  if (relation === 'PARENT') {
    if (age >= 18 && age <= 25) return coverPer1000 * 2.48;
    if (age >= 26 && age <= 30) return coverPer1000 * 3.88;
    if (age >= 31 && age <= 35) return coverPer1000 * 4.72;
    if (age >= 36 && age <= 40) return coverPer1000 * 5.48;
    if (age >= 41 && age <= 45) return coverPer1000 * 5.64;
    if (age >= 46 && age <= 50) return coverPer1000 * 6.44;
    if (age >= 51 && age <= 55) return coverPer1000 * 6.44;
    if (age >= 56 && age <= 60) return coverPer1000 * 8.94;
    if (age >= 61 && age <= 65) return coverPer1000 * 13.12;
    if (age >= 66 && age <= 70) return coverPer1000 * 20.08;
    if (age >= 71 && age <= 75) return coverPer1000 * 21.84;
  }
  
  // Extended family cover (18-64)
  if (relation === 'EXTENDED_FAMILY') {
    if (age >= 18 && age <= 45) return coverPer1000 * 2.55;
    if (age >= 46 && age <= 55) return coverPer1000 * 3.55;
    if (age >= 56 && age <= 64) return coverPer1000 * 4.55;
  }
  
  // Default fallback
  return coverPer1000 * 2.55;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize subscription plans
  const plans = [
    {
      name: 'OPPORTUNITY' as const,
      price: '350.00',
      description: 'Essential protection for everyday life',
      features: ['EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Funeral Cover', 'Accidental Death Cover', 'Funeral Assist', 'Family Income Benefit', 'Lawyer Assist', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services'],
      adumoPriceId: 'adumo_dev_opportunity_350'
    },
    {
      name: 'MOMENTUM' as const,
      price: '450.00',
      description: 'Enhanced protection with increased coverage',
      features: ['Funeral Cover: R5,000', 'Funeral Assist', 'EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Accidental Death Cover', 'Family Income Benefit', 'Lawyer Assist', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services'],
      adumoPriceId: 'adumo_dev_momentum_450'
    },
    {
      name: 'PROSPER' as const,
      price: '550.00',
      description: 'Comprehensive protection for growing families',
      features: ['Funeral Cover: R10,000', 'Accidental Death Cover: R20,000', 'Funeral Assist', 'Family Income Benefit: R5,000 x6', 'EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Virtual GP Assistant', 'Medical Second Opinion', 'Lawyer Assist', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services'],
      adumoPriceId: 'adumo_dev_prosper_550'
    },
    {
      name: 'PRESTIGE' as const,
      price: '695.00',
      description: 'Premium protection with superior benefits',
      features: ['Funeral Cover: R15,000', 'Accidental Death Cover: R50,000', 'Funeral Assist', 'Family Income Benefit: R5,000 x6', 'EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services', 'Lawyer Assist'],
      adumoPriceId: 'adumo_dev_prestige_695'
    },
    {
      name: 'PINNACLE' as const,
      price: '825.00',
      description: 'Ultimate protection with maximum coverage',
      features: ['Funeral Cover: R20,000', 'Accidental Death Cover: R100,000', 'Funeral Assist', 'Family Income Benefit: R5,000 x6', 'EMS Assist', 'Legal Assist', 'Lawyer Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services'],
      adumoPriceId: 'adumo_dev_pinnacle_825'
    }
  ];

  // Initialize plans in database with retry logic
  setTimeout(async () => {
    for (const planData of plans) {
      try {
        const existingPlan = await storage.getSubscriptionPlanByName(planData.name);
        if (!existingPlan) {
          await storage.createSubscriptionPlan({
            ...planData,
            features: JSON.stringify(planData.features) // Serialize array to JSON string
          });
          console.log(`Created plan: ${planData.name}`);
        }
      } catch (error) {
        console.error(`Error creating plan ${planData.name}:`, error);
      }
    }
  }, 2000); // Wait 2 seconds for database migration to complete

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

  // Configuration routes
  app.get('/api/config/adumo', (_req: Request, res: Response) => {
    res.json({
      merchantId: process.env.ADUMO_MERCHANT_ID
    });
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
      const result = await AdumoService.createSubscription(req.user.id, planName);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Full subscription creation with form data
  app.post('/api/subscriptions/create-full', authenticateToken, async (req: any, res: Response) => {
    try {
      const subscriptionData = req.body;
      
      // First, get the plan by ID to get the plan name
      const plan = await storage.getSubscriptionPlanById(subscriptionData.planId);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // Check if user already has a subscription to avoid duplicates
      const existingSubscription = await storage.getUserSubscription(req.user.id);
      
      let adumoResult;
      if (existingSubscription) {
        // If subscription exists for the same plan, return existing info
        const existingPlan = await storage.getSubscriptionPlanById(existingSubscription.planId);
        if (existingPlan?.name === plan.name) {
          const user = await storage.getUserById(req.user.id);
          return res.json({
            message: 'Subscription already exists for this plan',
            subscription: existingSubscription,
            subscriptionId: existingSubscription.adumoSubscriptionId,
            paymentData: AdumoService.generatePaymentData(plan, user)
          });
        }
        // Update existing subscription to new plan
        adumoResult = await AdumoService.updateSubscription(req.user.id, plan.name);
      } else {
        // Create new subscription with Adumo using plan name
        adumoResult = await AdumoService.createSubscription(req.user.id, plan.name);
      }
      
      // Check if adumoResult has subscription info or is an error
      if (!('subscriptionId' in adumoResult)) {
        return res.status(400).json(adumoResult);
      }

      // Create extended cover entries for each family member
      if (subscriptionData.extendedMembers && subscriptionData.extendedMembers.length > 0) {
        for (const member of subscriptionData.extendedMembers) {
          await storage.createExtendedCover({
            userId: req.user.id,
            name: member.firstName + ' ' + member.surname,
            surname: member.surname,
            age: 0, // Will be calculated from ID
            relation: member.relation,
            coverAmount: member.coverAmount.toString(),
            monthlyPremium: '0', // Will be calculated
            idNumber: member.idNumber,
            dateOfBirth: null
          });
        }
      }
      
      // Get the subscription that was created by AdumoService
      const subscription = await storage.getUserSubscription(req.user.id);
      
      res.json({
        message: 'Subscription created successfully',
        subscription: subscription,
        subscriptionId: adumoResult.subscriptionId,
        paymentData: 'paymentData' in adumoResult ? adumoResult.paymentData : undefined
      });
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
      const result = await AdumoService.updateSubscription(req.user.id, planName);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/subscriptions/cancel', authenticateToken, async (req: any, res: Response) => {
    try {
      const result = await AdumoService.cancelSubscription(req.user.id);
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

  // Extended cover routes
  app.get('/api/extended-cover', authenticateToken, async (req: any, res: Response) => {
    try {
      const covers = await storage.getUserExtendedCover(req.user.id);
      res.json({ covers });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/extended-cover', authenticateToken, async (req: any, res: Response) => {
    try {
      const coverData = createExtendedCoverSchema.parse(req.body);
      
      // Calculate premium based on age, relation, and cover amount
      const monthlyPremium = calculatePremium(coverData.age, coverData.relation, coverData.coverAmount);
      
      const cover = await storage.createExtendedCover({
        ...coverData,
        userId: req.user.id,
        coverAmount: coverData.coverAmount.toString(),
        monthlyPremium: monthlyPremium.toString()
      });
      
      res.json({ cover });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid data provided', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/extended-cover/:id', authenticateToken, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const coverData = createExtendedCoverSchema.partial().parse(req.body);
      
      // Recalculate premium if age, relation, or cover amount changed
      let updateData: any = { ...coverData };
      if (coverData.age || coverData.relation || coverData.coverAmount) {
        const existingCover = await storage.getUserExtendedCover(req.user.id);
        const cover = existingCover.find(c => c.id === id);
        if (!cover) {
          return res.status(404).json({ message: 'Extended cover not found' });
        }
        
        const age = coverData.age || cover.age;
        const relation = coverData.relation || cover.relation;
        const coverAmount = coverData.coverAmount || Number(cover.coverAmount);
        
        const monthlyPremium = calculatePremium(age, relation, coverAmount);
        updateData.monthlyPremium = monthlyPremium.toString();
        if (coverData.coverAmount) {
          updateData.coverAmount = coverData.coverAmount.toString();
        }
      }
      
      const cover = await storage.updateExtendedCover(id, updateData);
      res.json({ cover });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid data provided', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/extended-cover/:id', authenticateToken, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteExtendedCover(id);
      res.json({ message: 'Extended cover deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transaction routes
  app.get('/api/transactions', authenticateToken, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const transactions = await storage.getTransactionsByUserId(userId);
      
      res.json({ 
        transactions: transactions.map(transaction => ({
          id: transaction.id,
          invoiceId: transaction.invoiceId,
          merchantReference: transaction.merchantReference,
          adumoTransactionId: transaction.adumoTransactionId,
          adumoStatus: transaction.adumoStatus,
          paymentMethod: transaction.paymentMethod,
          gateway: transaction.gateway,
          amount: transaction.amount,
          currency: transaction.currency,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }))
      });
    } catch (error: any) {
      console.error('Error fetching user transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
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

  // Test endpoints for credential verification
  app.post('/api/test/adumo', async (_req: Request, res: Response) => {
    try {
      if (!process.env.ADUMO_API_KEY) {
        return res.status(400).json({ success: false, message: 'ADUMO_API_KEY not configured' });
      }

      // Simple validation of Adumo configuration
      const requiredFields = ['ADUMO_MERCHANT_ID', 'ADUMO_STORE_ID', 'ADUMO_APPLICATION_ID'];
      const missing = requiredFields.filter(field => !process.env[field]);
      
      if (missing.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Missing Adumo configuration: ${missing.join(', ')}` 
        });
      }
      
      res.json({ success: true, message: 'Adumo credentials are configured' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: `Adumo error: ${error.message}` });
    }
  });

  app.post('/api/test/smtp', async (_req: Request, res: Response) => {
    try {
      const emailUser = process.env.SMTP_USER;
      const emailPass = process.env.SMTP_PASS;
      
      if (!emailUser || !emailPass) {
        return res.status(400).json({ 
          success: false, 
          message: 'SMTP credentials not configured (missing SMTP_USER or SMTP_PASS)' 
        });
      }

      const port = Number(process.env.SMTP_PORT || 587);
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: port === 465,
        auth: { 
          user: emailUser, 
          pass: emailPass 
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.verify(); // Test SMTP connection
      
      res.json({ success: true, message: 'SMTP credentials are working' });
    } catch (error: any) {
      res.status(400).json({ success: false, message: `SMTP error: ${error.message}` });
    }
  });

  // Adumo webhook
  // Webhook endpoint with raw body parsing for signature verification
  app.post('/api/webhooks/adumo', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    try {
      // Verify webhook authenticity first
      const isValid = AdumoService.verifyWebhookSignature(req);
      if (!isValid) {
        console.error('Invalid webhook signature from:', req.ip);
        return res.status(401).json({ message: 'Unauthorized - Invalid signature' });
      }

      // Parse the verified payload
      const payload = JSON.parse(req.body.toString());
      await AdumoService.processPaymentWebhook(payload);
      res.json({ received: true });
    } catch (error: any) {
      console.error('Adumo webhook error:', error.message);
      res.status(400).json({ message: `Webhook Error: ${error.message}` });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Test transactions endpoint
  app.post('/api/test/transactions', async (req: Request, res: Response) => {
    try {
      // First get a test user and create an invoice
      const [testUser] = await storage.getAllUsers();
      if (!testUser) {
        return res.status(400).json({ message: 'No test user found' });
      }

      // Create a test invoice
      const testInvoice = await storage.createInvoice({
        userId: testUser.id,
        amount: "350.00",
        currency: "ZAR",
        status: "pending",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      // Create test transaction
      const merchantRef = `TEST_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const testTransaction = await storage.createTransaction({
        invoiceId: testInvoice.id,
        userId: testUser.id,
        merchantReference: merchantRef,
        adumoTransactionId: `ADU_${Date.now()}`,
        adumoStatus: 'PENDING',
        paymentMethod: 'CARD',
        gateway: 'ADUMO',
        amount: "350.00",
        currency: "ZAR",
        requestPayload: JSON.stringify({ test: 'data', amount: 350 }),
        responsePayload: JSON.stringify({ status: 'pending' }),
      });

      // Test retrieval methods
      const transactionById = await storage.getTransactionByMerchantReference(merchantRef);
      const userTransactions = await storage.getTransactionsByUserId(testUser.id);
      const invoiceTransactions = await storage.getTransactionsByInvoiceId(testInvoice.id);

      res.json({
        success: true,
        data: {
          createdTransaction: testTransaction,
          retrievedByMerchantRef: transactionById,
          userTransactionsCount: userTransactions.length,
          invoiceTransactionsCount: invoiceTransactions.length,
          latestUserTransaction: userTransactions[0]
        }
      });
    } catch (error: any) {
      console.error('Transaction test error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get transactions for user endpoint
  app.get('/api/transactions/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const transactions = await storage.getTransactionsByUserId(userId);
      res.json({ transactions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
