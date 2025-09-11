import { storage } from '../storage';
import { sendEmail } from './email';
import jwt from 'jsonwebtoken';

// Adumo Online Virtual Payment Gateway Configuration
interface AdumoConfig {
  merchantId: string;
  applicationId: string;
  jwtSecret: string;
  testUrl: string;
  prodUrl: string;
  environment: 'test' | 'production';
}

// Adumo configuration - requires environment variables to be set
const ADUMO_CONFIG: AdumoConfig = {
  merchantId: process.env.ADUMO_MERCHANT_ID!,
  applicationId: process.env.ADUMO_APPLICATION_ID!,
  jwtSecret: process.env.ADUMO_JWT_SECRET!,
  testUrl: 'https://staging-apiv3.adumoonline.com/product/payment/v1/initialisevirtual',
  prodUrl: 'https://apiv3.adumoonline.com/product/payment/v1/initialisevirtual',
  environment: (process.env.NODE_ENV === 'production' ? 'production' : 'test') as 'test' | 'production'
};

// Validate required environment variables
if (!ADUMO_CONFIG.merchantId || !ADUMO_CONFIG.applicationId || !ADUMO_CONFIG.jwtSecret) {
  throw new Error('Missing required Adumo environment variables: ADUMO_MERCHANT_ID, ADUMO_APPLICATION_ID, ADUMO_JWT_SECRET');
}

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
    
    // Generate payment data early to get merchant reference
    const paymentData = this.generatePaymentData(plan, user);
    
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
    const invoice = await storage.createInvoice({
      userId,
      subscriptionId: subscription.id,
      amount: plan.price,
      currency: 'ZAR',
      status: 'paid',
      paidAt: now
    });

    // Create transaction record for payment tracking
    await storage.createTransaction({
      invoiceId: invoice.id,
      userId,
      merchantReference: paymentData.merchantReference,
      adumoTransactionId: null, // Will be updated when payment is processed
      adumoStatus: 'SUCCESS',
      paymentMethod: null,
      gateway: 'ADUMO',
      amount: plan.price,
      currency: 'ZAR',
      requestPayload: JSON.stringify(paymentData),
      responsePayload: null,
      notifyUrlResponse: null
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
      paymentData,
      requiresPayment: true,
      message: 'Subscription created successfully'
    };
  }

  static generatePaymentData(plan: any, user: any) {
    // Generate JWT token for authentication
    const payload = {
      merchantId: ADUMO_CONFIG.merchantId,
      applicationId: ADUMO_CONFIG.applicationId,
      timestamp: Date.now()
    };
    
    const token = jwt.sign(payload, ADUMO_CONFIG.jwtSecret, { expiresIn: '1h' });
    
    // Prepare payment form data according to Adumo Virtual specifications
    const reference = `sub_${user.id}_${Date.now()}`;
    const merchantReference = `OPIAN_${user.id.substring(0, 8)}_${Date.now()}`;
    const amount = (parseFloat(plan.price) * 100).toString(); // Convert to cents
    
    return {
      // Form POST URL
      url: ADUMO_CONFIG.environment === 'production' ? ADUMO_CONFIG.prodUrl : ADUMO_CONFIG.testUrl,
      
      // Required form parameters for Adumo Virtual
      formData: {
        MerchantUID: ADUMO_CONFIG.merchantId,
        ApplicationUID: ADUMO_CONFIG.applicationId,
        TransactionReference: reference,
        MerchantReference: merchantReference,
        Amount: amount,
        Currency: 'ZAR',
        Description: `${plan.name} Plan - Monthly Subscription`,
        CustomerFirstName: user.name.split(' ')[0] || user.name,
        CustomerLastName: user.name.split(' ').slice(1).join(' ') || '',
        CustomerEmail: user.email,
        ReturnURL: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard?payment=success&ref=${reference}`,
        CancelURL: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/choose-plan?payment=canceled`,
        WebhookURL: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/webhooks/adumo`,
        Token: token
      },
      
      reference,
      merchantReference,
      token
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
      const invoice = await storage.createInvoice({
        userId,
        subscriptionId: currentSubscription.id,
        amount: proratedAmount.toString(),
        currency: 'ZAR',
        status: 'pending'
      });

      // Create transaction for the upgrade charge
      await storage.createTransaction({
        invoiceId: invoice.id,
        userId,
        merchantReference: `OPIAN_UPGRADE_${userId.substring(0, 8)}_${Date.now()}`,
        adumoTransactionId: null,
        adumoStatus: 'PENDING',
        paymentMethod: null,
        gateway: 'ADUMO',
        amount: proratedAmount.toString(),
        currency: 'ZAR',
        requestPayload: null,
        responsePayload: null,
        notifyUrlResponse: null
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
    // Handle Adumo webhook notifications according to Virtual payment response
    try {
      // Adumo Virtual sends different response parameters
      const { TransactionReference: reference, Status: status, Amount: amount, TransactionID: transaction_id } = payload;
      
      if (status === 'successful' || status === 'Successful') {
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

        // Create invoice for this payment
        const invoice = await storage.createInvoice({
          userId,
          subscriptionId: subscription.id,
          amount: (amount / 100).toString(),
          currency: 'ZAR',
          status: 'paid',
          paidAt: new Date()
        });

        // Create transaction record for this payment
        await storage.createTransaction({
          invoiceId: invoice.id,
          userId,
          merchantReference: `OPIAN_${userId.substring(0, 8)}_${Date.now()}`,
          adumoTransactionId: transaction_id,
          adumoStatus: 'SUCCESS',
          paymentMethod: payload.PaymentMethod || null,
          gateway: 'ADUMO',
          amount: (amount / 100).toString(),
          currency: 'ZAR',
          requestPayload: null,
          responsePayload: JSON.stringify({
            transaction_id,
            amount,
            payment_method: payload.PaymentMethod || null,
            result: 'SUCCESS'
          }),
          notifyUrlResponse: JSON.stringify(payload)
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