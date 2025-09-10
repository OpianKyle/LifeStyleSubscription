import { storage } from '../storage';
import { sendEmail } from './email';

// Adumo Online Payment Gateway Configuration
interface AdumoConfig {
  merchantId: string;
  storeId: string;
  applicationId: string;
  apiKey: string;
  baseUrl: string;
}

const ADUMO_CONFIG: AdumoConfig = {
  merchantId: process.env.ADUMO_MERCHANT_ID || '',
  storeId: process.env.ADUMO_STORE_ID || '',
  applicationId: process.env.ADUMO_APPLICATION_ID || '',
  apiKey: process.env.ADUMO_API_KEY || '',
  baseUrl: process.env.ADUMO_BASE_URL || 'https://api.adumo.com/v1'
};

export class AdumoService {
  static async createCustomer(userId: string, email: string, name: string) {
    const user = await storage.getUserById(userId);
    
    if (user?.adumoCustomerId) {
      return user.adumoCustomerId;
    }

    // Generate a simple customer ID for now (in production, use Adumo's customer creation API)
    const customerId = `cust_${userId}_${Date.now()}`;

    await storage.updateUser(userId, { adumoCustomerId: customerId });
    return customerId;
  }

  static async createSubscription(userId: string, planName: string) {
    try {
      const user = await storage.getUserById(userId);
      const plan = await storage.getSubscriptionPlanByName(planName);
      const existingSubscription = await storage.getUserSubscription(userId);
      
      if (!user || !plan) {
        throw new Error('User or plan not found');
      }

      // If user already has a subscription, handle plan change
      if (existingSubscription) {
        const existingPlan = await storage.getSubscriptionPlanById(existingSubscription.planId);
        if (existingPlan?.name === planName) {
          return {
            subscriptionId: existingSubscription.adumoSubscriptionId,
            customerId: user.adumoCustomerId || '',
            status: existingSubscription.status,
            message: 'Subscription already exists for this plan'
          };
        }
        return await this.updateSubscription(userId, planName);
      }

      return await this.createNewSubscription(userId, planName);
    } catch (error) {
      throw error;
    }
  }

  static async createNewSubscription(userId: string, planName: string) {
    const user = await storage.getUserById(userId);
    const plan = await storage.getSubscriptionPlanByName(planName);
    
    if (!user || !plan) {
      throw new Error('User or plan not found');
    }

    // Create customer if doesn't exist
    const customerId = await this.createCustomer(userId, user.email, user.name);

    // For development, create a subscription without actual payment processing
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const subscriptionId = `sub_${userId}_${Date.now()}`;
    
    const subscriptionData = {
      userId,
      planId: plan.id,
      adumoSubscriptionId: subscriptionId,
      status: 'ACTIVE' as const,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth
    };

    const subscription = await storage.createSubscription(subscriptionData);
    
    // Update user with subscription ID
    await storage.updateUser(userId, { adumoSubscriptionId: subscriptionId });

    // Create initial invoice
    await storage.createInvoice({
      userId,
      subscriptionId: subscription.id,
      adumoInvoiceId: `inv_${userId}_${Date.now()}`,
      amount: plan.price,
      currency: 'ZAR',
      status: 'paid',
      paidAt: now
    });

    // Send welcome email
    try {
      await sendEmail('welcome', {
        name: user.name,
        planName: plan.name,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/auth`
      }, user.email, `Welcome to Opian Lifestyle - ${plan.name} Plan`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return {
      subscriptionId,
      customerId,
      paymentUrl: this.generatePaymentUrl(plan, user),
      requiresPayment: true,
      message: 'Subscription created successfully'
    };
  }

  static async updateSubscription(userId: string, newPlanName: string) {
    const user = await storage.getUserById(userId);
    const currentSubscription = await storage.getUserSubscription(userId);
    const newPlan = await storage.getSubscriptionPlanByName(newPlanName);
    
    if (!user || !currentSubscription || !newPlan) {
      throw new Error('User, subscription, or plan not found');
    }

    // Update subscription plan
    await storage.updateSubscription(currentSubscription.id, {
      planId: newPlan.id
    });

    // Create prorated invoice for plan change
    const proratedAmount = await this.calculateProration(currentSubscription, newPlan);
    
    if (proratedAmount > 0) {
      await storage.createInvoice({
        userId,
        subscriptionId: currentSubscription.id,
        adumoInvoiceId: `inv_upgrade_${userId}_${Date.now()}`,
        amount: proratedAmount.toString(),
        currency: 'ZAR',
        status: 'pending'
      });
    }

    return { 
      message: 'Subscription updated successfully',
      proratedAmount: proratedAmount > 0 ? proratedAmount : 0
    };
  }

  static async cancelSubscription(userId: string) {
    const user = await storage.getUserById(userId);
    const subscription = await storage.getUserSubscription(userId);
    
    if (!user || !subscription) {
      throw new Error('User or subscription not found');
    }

    await storage.cancelSubscription(subscription.id);

    // Send cancellation email
    try {
      await sendEmail('subscriptionChange', {
        name: user.name,
        oldPlan: subscription.plan.name,
        newPlan: 'Canceled',
        changeDate: new Date().toLocaleDateString(),
        nextBilling: new Date(subscription.currentPeriodEnd!).toLocaleDateString()
      }, user.email, 'Your Opian Lifestyle subscription has been canceled');
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    return { message: 'Subscription canceled successfully' };
  }

  static generatePaymentUrl(plan: any, user: any): string {
    // Generate Adumo payment URL with proper parameters
    const params = new URLSearchParams({
      merchant_id: ADUMO_CONFIG.merchantId,
      store_id: ADUMO_CONFIG.storeId,
      amount: (parseFloat(plan.price) * 100).toString(), // Convert to cents
      currency: 'ZAR',
      description: `${plan.name} Plan - Monthly Subscription`,
      customer_email: user.email,
      customer_name: user.name,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/choose-plan?payment=canceled`,
      reference: `sub_${user.id}_${Date.now()}`
    });

    return `${ADUMO_CONFIG.baseUrl}/payment?${params.toString()}`;
  }

  private static async calculateProration(currentSubscription: any, newPlan: any): Promise<number> {
    // Simple proration calculation
    const currentPlan = await storage.getSubscriptionPlanById(currentSubscription.planId);
    if (!currentPlan) return 0;

    const currentPrice = parseFloat(currentPlan.price);
    const newPrice = parseFloat(newPlan.price);
    const priceDifference = newPrice - currentPrice;

    // For simplicity, return the price difference
    // In production, calculate based on remaining days in billing cycle
    return Math.max(0, priceDifference);
  }

  static async processPaymentWebhook(payload: any) {
    // Handle Adumo webhook notifications
    try {
      const { reference, status, amount, transaction_id } = payload;
      
      if (status === 'successful') {
        // Extract user ID from reference
        const userIdMatch = reference.match(/sub_(.+?)_/);
        if (!userIdMatch) return;

        const userId = userIdMatch[1];
        const user = await storage.getUserById(userId);
        const subscription = await storage.getUserSubscription(userId);

        if (!user || !subscription) return;

        // Update subscription status and create invoice
        await storage.updateSubscription(subscription.id, {
          status: 'ACTIVE'
        });

        await storage.createInvoice({
          userId,
          subscriptionId: subscription.id,
          adumoInvoiceId: transaction_id,
          amount: (amount / 100).toString(),
          currency: 'ZAR',
          status: 'paid',
          paidAt: new Date()
        });

        // Send payment confirmation email
        const plan = await storage.getSubscriptionPlanById(subscription.planId);
        if (plan) {
          await sendEmail('paymentReceipt', {
            name: user.name,
            planName: plan.name,
            amount: `R${(amount / 100).toFixed(2)}`,
            date: new Date().toLocaleDateString(),
            transactionId: transaction_id
          }, user.email, 'Payment receipt for your Opian Lifestyle subscription');
        }
      }
    } catch (error) {
      console.error('Error processing Adumo webhook:', error);
      throw error;
    }
  }
}