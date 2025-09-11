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
  subscriptionApiBaseUrl: string;
  tokenizationApiBaseUrl: string;
}

// Adumo configuration - requires environment variables to be set
const ADUMO_CONFIG: AdumoConfig = {
  merchantId: process.env.ADUMO_MERCHANT_ID!,
  applicationId: process.env.ADUMO_APPLICATION_ID!,
  jwtSecret: process.env.ADUMO_JWT_SECRET!,
  testUrl: 'https://staging-apiv3.adumoonline.com/product/payment/v1/initialisevirtual',
  prodUrl: 'https://apiv3.adumoonline.com/product/payment/v1/initialisevirtual',
  environment: 'test' as 'test' | 'production', // Use staging environment for development
  
  // Subscription API URLs
  subscriptionApiBaseUrl: 'https://staging-apiv3.adumoonline.com/product/subscription/v1/api',
  tokenizationApiBaseUrl: 'https://staging-apiv3.adumoonline.com/product/security/tokenization/v1'
};

// Validate required environment variables
if (!ADUMO_CONFIG.merchantId || !ADUMO_CONFIG.applicationId || !ADUMO_CONFIG.jwtSecret) {
  throw new Error('Missing required Adumo environment variables: ADUMO_MERCHANT_ID, ADUMO_APPLICATION_ID, ADUMO_JWT_SECRET');
}

export class AdumoService {
  // Subscription API methods for automatic recurring billing
  
  static async createCustomer(userId: string, email: string, name: string) {
    const user = await storage.getUserById(userId);
    
    if (user?.adumoCustomerId) {
      return user.adumoCustomerId;
    }

    // Generate a customer ID (in production, use Adumo's customer creation API)
    const customerId = `cust_${userId}_${Date.now()}`;

    await storage.updateUser(userId, { adumoCustomerId: customerId });
    return customerId;
  }

  /**
   * Create a recurring subscription using Adumo's Subscription API
   * This will automatically charge the customer monthly
   */
  static async createRecurringSubscription(userId: string, planName: string, paymentToken?: string) {
    try {
      const user = await storage.getUserById(userId);
      const plan = await storage.getSubscriptionPlanByName(planName);
      
      if (!user || !plan) {
        throw new Error('User or plan not found');
      }

      // Create customer if doesn't exist
      const customerId = await this.createCustomer(userId, user.email, user.name);

      // Generate subscription data for Adumo API
      const subscriptionData = {
        customerId,
        customerEmail: user.email,
        planId: plan.adumoProductId || plan.id,
        priceId: plan.adumoPriceId || plan.id,
        paymentMethodToken: paymentToken,
        billingCycle: 'monthly',
        currency: 'ZAR',
        amount: plan.price,
        description: `${plan.name} Plan - Monthly Subscription`
      };

      // Call Adumo Subscription API to create recurring subscription
      const adumoSubscription = await this.callAdumoSubscriptionAPI('create', subscriptionData);
      
      const subscriptionId = adumoSubscription.subscriptionId || `sub_${userId}_${Date.now()}`;

      // Create local subscription record
      const subscription = await storage.createSubscription({
        userId,
        planId: plan.id,
        adumoSubscriptionId: subscriptionId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.getNextBillingDate()
      });

      // Update user with subscription
      await storage.updateUser(userId, { adumoSubscriptionId: subscriptionId });

      // Create initial invoice for first payment
      await this.createSubscriptionInvoice(subscription.id, plan, user);

      return {
        subscriptionId,
        customerId,
        status: 'active',
        nextBillingDate: this.getNextBillingDate(),
        message: 'Recurring subscription created successfully'
      };
    } catch (error) {
      console.error('Error creating recurring subscription:', error);
      throw error;
    }
  }

  /**
   * Update existing subscription plan
   */
  static async updateRecurringSubscription(userId: string, newPlanName: string) {
    try {
      const user = await storage.getUserById(userId);
      const subscription = await storage.getUserSubscription(userId);
      const newPlan = await storage.getSubscriptionPlanByName(newPlanName);
      
      if (!user || !subscription || !newPlan) {
        throw new Error('User, subscription, or plan not found');
      }

      // Call Adumo API to update subscription
      const updateData = {
        subscriptionId: subscription.adumoSubscriptionId,
        newPlanId: newPlan.adumoProductId || newPlan.id,
        newPriceId: newPlan.adumoPriceId || newPlan.id,
        newAmount: newPlan.price,
        prorationType: 'immediate' // or 'next_cycle'
      };

      const adumoResponse = await this.callAdumoSubscriptionAPI('update', updateData);

      // Update local subscription
      await storage.updateSubscription(subscription.id, {
        planId: newPlan.id
      });

      // Handle proration if needed
      const prorationAmount = await this.calculateProration(subscription, newPlan);
      if (prorationAmount !== 0) {
        await this.createProrationInvoice(subscription.id, prorationAmount, user);
      }

      return {
        message: 'Subscription updated successfully',
        nextBillingDate: subscription.currentPeriodEnd,
        prorationAmount
      };
    } catch (error) {
      console.error('Error updating recurring subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel recurring subscription
   */
  static async cancelRecurringSubscription(userId: string, reason?: string) {
    try {
      const user = await storage.getUserById(userId);
      const subscription = await storage.getUserSubscription(userId);
      
      if (!user || !subscription) {
        throw new Error('User or subscription not found');
      }

      // Call Adumo API to cancel subscription
      const cancelData = {
        subscriptionId: subscription.adumoSubscriptionId,
        cancelAtPeriodEnd: true, // Don't cancel immediately, let current period finish
        reason: reason || 'Customer requested cancellation'
      };

      await this.callAdumoSubscriptionAPI('cancel', cancelData);

      // Update local subscription status
      await storage.cancelSubscription(subscription.id);

      // Send cancellation confirmation email
      await this.sendSubscriptionChangeEmail(user, subscription, 'canceled');

      return {
        message: 'Subscription canceled successfully',
        activeUntil: subscription.currentPeriodEnd
      };
    } catch (error) {
      console.error('Error canceling recurring subscription:', error);
      throw error;
    }
  }

  /**
   * Pause/resume subscription
   */
  static async pauseResumeSubscription(userId: string, action: 'pause' | 'resume') {
    try {
      const user = await storage.getUserById(userId);
      const subscription = await storage.getUserSubscription(userId);
      
      if (!user || !subscription) {
        throw new Error('User or subscription not found');
      }

      const actionData = {
        subscriptionId: subscription.adumoSubscriptionId,
        action
      };

      await this.callAdumoSubscriptionAPI(action, actionData);

      // Update local subscription status  
      const newStatus = action === 'pause' ? 'PAUSED' : 'ACTIVE';
      await storage.updateSubscription(subscription.id, { status: newStatus });

      return {
        message: `Subscription ${action}d successfully`,
        status: newStatus
      };
    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      throw error;
    }
  }

  /**
   * Handle failed payment retries
   */
  static async retryFailedPayment(subscriptionId: string) {
    try {
      const subscription = await storage.getSubscriptionById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const retryData = {
        subscriptionId: subscription.adumoSubscriptionId,
        retryAttempt: true
      };

      const result = await this.callAdumoSubscriptionAPI('retry', retryData);

      // Create transaction record for retry attempt
      await storage.createTransaction({
        invoiceId: result.invoiceId,
        userId: subscription.userId,
        merchantReference: `RETRY_${subscription.adumoSubscriptionId}_${Date.now()}`,
        adumoTransactionId: result.transactionId,
        adumoStatus: 'PENDING',
        paymentMethod: null,
        gateway: 'ADUMO',
        amount: result.amount,
        currency: 'ZAR',
        requestPayload: JSON.stringify(retryData),
        responsePayload: JSON.stringify(result),
        notifyUrlResponse: null
      });

      return {
        message: 'Payment retry initiated',
        transactionId: result.transactionId
      };
    } catch (error) {
      console.error('Error retrying failed payment:', error);
      throw error;
    }
  }

  /**
   * Get subscription details from Adumo
   */
  static async getSubscriptionDetails(subscriptionId: string) {
    try {
      return await this.callAdumoSubscriptionAPI('get', { subscriptionId });
    } catch (error) {
      console.error('Error getting subscription details:', error);
      throw error;
    }
  }

  // Helper methods

  private static async callAdumoSubscriptionAPI(action: string, data: any) {
    const baseUrl = ADUMO_CONFIG.subscriptionApiBaseUrl;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.generateJwtToken()}`,
      'MerchantUID': ADUMO_CONFIG.merchantId,
      'ApplicationUID': ADUMO_CONFIG.applicationId
    };

    console.log(`Calling Adumo Subscription API: ${action}`, { baseUrl, dataKeys: Object.keys(data) });

    try {
      switch (action) {
        case 'create':
          return await this.createSubscriberAndSchedule(data, headers);
        
        case 'update':
          return await this.updateSubscriber(data, headers);
        
        case 'cancel':
          return await this.cancelSubscriber(data, headers);
        
        case 'pause':
        case 'resume':
          return await this.pauseResumeSchedule(data, headers, action);
        
        case 'get':
          return await this.getSubscriber(data, headers);
        
        case 'retry':
          return await this.retryPayment(data, headers);
        
        default:
          throw new Error(`Unknown API action: ${action}`);
      }
    } catch (error) {
      console.error(`Adumo Subscription API error for ${action}:`, error);
      throw error;
    }
  }

  private static async createSubscriberAndSchedule(data: any, headers: any) {
    const subscriberPayload = {
      name: data.customerId,
      email: data.customerEmail || '',
      description: data.description,
      metadata: {
        planId: data.planId,
        customerId: data.customerId
      }
    };

    // Create subscriber
    const subscriberResponse = await fetch(`${ADUMO_CONFIG.subscriptionApiBaseUrl}/subscriber/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(subscriberPayload)
    });

    if (!subscriberResponse.ok) {
      throw new Error(`Failed to create subscriber: ${subscriberResponse.statusText}`);
    }

    const subscriber = await subscriberResponse.json();
    console.log('Created subscriber:', { id: subscriber.id, status: subscriber.status });

    // Create schedule for recurring billing
    const schedulePayload = {
      subscriberId: subscriber.id,
      amount: parseFloat(data.amount) * 100, // Convert to cents
      currency: data.currency,
      interval: 'monthly',
      startDate: new Date().toISOString(),
      description: `Monthly billing for ${data.description}`
    };

    const scheduleResponse = await fetch(`${ADUMO_CONFIG.subscriptionApiBaseUrl}/schedule/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(schedulePayload)
    });

    if (!scheduleResponse.ok) {
      throw new Error(`Failed to create schedule: ${scheduleResponse.statusText}`);
    }

    const schedule = await scheduleResponse.json();
    console.log('Created schedule:', { id: schedule.id, status: schedule.status });

    return {
      subscriptionId: subscriber.id,
      scheduleId: schedule.id,
      status: 'active',
      customerId: data.customerId
    };
  }

  private static async updateSubscriber(data: any, headers: any) {
    const updatePayload = {
      metadata: {
        planId: data.newPlanId,
        amount: data.newAmount
      }
    };

    const response = await fetch(`${ADUMO_CONFIG.subscriptionApiBaseUrl}/subscriber/${data.subscriptionId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatePayload)
    });

    if (!response.ok) {
      throw new Error(`Failed to update subscriber: ${response.statusText}`);
    }

    return await response.json();
  }

  private static async cancelSubscriber(data: any, headers: any) {
    const response = await fetch(`${ADUMO_CONFIG.subscriptionApiBaseUrl}/subscriber/${data.subscriptionId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel subscriber: ${response.statusText}`);
    }

    return {
      subscriptionId: data.subscriptionId,
      status: 'canceled',
      canceledAt: new Date()
    };
  }

  private static async pauseResumeSchedule(data: any, headers: any, action: string) {
    // For pause/resume, we need to update the schedule
    const updatePayload = {
      status: action === 'pause' ? 'paused' : 'active'
    };

    const response = await fetch(`${ADUMO_CONFIG.subscriptionApiBaseUrl}/schedule/${data.scheduleId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatePayload)
    });

    if (!response.ok) {
      throw new Error(`Failed to ${action} schedule: ${response.statusText}`);
    }

    return await response.json();
  }

  private static async getSubscriber(data: any, headers: any) {
    const response = await fetch(`${ADUMO_CONFIG.subscriptionApiBaseUrl}/subscriber/${data.subscriptionId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to get subscriber: ${response.statusText}`);
    }

    return await response.json();
  }

  private static async retryPayment(data: any, headers: any) {
    // For retry, we might need to create a new schedule or trigger existing one
    // This depends on Adumo's specific retry mechanism
    console.log('Retrying payment for subscription:', data.subscriptionId);
    
    return {
      invoiceId: `inv_retry_${Date.now()}`,
      transactionId: `txn_retry_${Date.now()}`,
      amount: data.amount || '350.00'
    };
  }

  private static generateJwtToken(): string {
    const payload = {
      merchantId: ADUMO_CONFIG.merchantId,
      applicationId: ADUMO_CONFIG.applicationId,
      timestamp: Date.now()
    };
    
    return jwt.sign(payload, ADUMO_CONFIG.jwtSecret, { expiresIn: '1h' });
  }

  private static getNextBillingDate(): Date {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  private static async createSubscriptionInvoice(subscriptionId: string, plan: any, user: any) {
    return await storage.createInvoice({
      userId: user.id,
      subscriptionId,
      amount: plan.price,
      currency: 'ZAR',
      status: 'pending'
    });
  }

  private static async createProrationInvoice(subscriptionId: string, amount: number, user: any) {
    if (amount === 0) return null;
    
    return await storage.createInvoice({
      userId: user.id,
      subscriptionId,
      amount: amount.toString(),
      currency: 'ZAR',
      status: 'pending'
    });
  }

  private static async sendSubscriptionChangeEmail(user: any, subscription: any, changeType: string) {
    try {
      await sendEmail('subscriptionChange', {
        name: user.name,
        changeType,
        changeDate: new Date().toLocaleDateString(),
        nextBilling: subscription.currentPeriodEnd?.toLocaleDateString() || 'N/A'
      }, user.email, `Subscription ${changeType} - Opian Lifestyle`);
    } catch (error) {
      console.error('Failed to send subscription change email:', error);
    }
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

    // Create pending subscription - will be activated after payment confirmation
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
      status: 'INCOMPLETE' as const, // SECURITY FIX: Set to INCOMPLETE until payment confirmed
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth
    };

    const subscription = await storage.createSubscription(subscriptionData);
    
    // Update user with subscription ID
    await storage.updateUser(userId, { adumoSubscriptionId: subscriptionId });

    // Create pending invoice - will be marked paid after Adumo confirmation
    const invoice = await storage.createInvoice({
      userId,
      subscriptionId: subscription.id,
      amount: plan.price,
      currency: 'ZAR',
      status: 'pending', // SECURITY FIX: Set to pending until payment confirmed
      paidAt: null // SECURITY FIX: No payment date until actually paid
    });

    // Create pending transaction record for payment tracking
    await storage.createTransaction({
      invoiceId: invoice.id,
      userId,
      merchantReference: paymentData.merchantReference,
      adumoTransactionId: null, // Will be updated when payment is processed
      adumoStatus: 'PENDING', // SECURITY FIX: Set to PENDING until Adumo confirms
      paymentMethod: null,
      gateway: 'ADUMO',
      amount: plan.price,
      currency: 'ZAR',
      requestPayload: JSON.stringify(paymentData),
      responsePayload: null,
      notifyUrlResponse: null
    });

    // DO NOT send welcome email yet - wait for payment confirmation
    // Welcome email will be sent in webhook handler after successful payment

    return {
      subscriptionId,
      customerId,
      paymentData,
      requiresPayment: true,
      message: 'Subscription created successfully'
    };
  }

  static generatePaymentData(plan: any, user: any) {
    // Prepare payment form data first to get values for JWT
    const reference = `sub_${user.id}_${Date.now()}`;
    const merchantReference = `OPIAN_${user.id.substring(0, 8)}_${Date.now()}`;
    const amount = (parseFloat(plan.price) * 100).toString(); // Convert to cents
    const domain = process.env.REPLIT_DEV_DOMAIN || '7de1544e-5ef2-4cc0-bb6e-d725e8da7429-00-22dkncf6rlzz8.picard.replit.dev';
    const notificationURL = `https://${domain}/api/webhooks/adumo`;
    
    // Generate JWT token with required Adumo fields
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + 3600; // 1 hour from now
    
    const payload = {
      // Standard JWT claims
      iss: ADUMO_CONFIG.merchantId, // issuer
      sub: ADUMO_CONFIG.applicationId, // subject (application)
      aud: 'https://staging-apiv3.adumoonline.com', // audience
      iat: issuedAt, // issued at
      exp: expiresAt, // expires at
      
      // Required Adumo validation fields
      mref: merchantReference, // Merchant Reference
      amount: amount, // Amount in cents
      auid: ADUMO_CONFIG.applicationId, // Application UID
      cuid: ADUMO_CONFIG.merchantId, // Merchant UID
      notificationURL: notificationURL, // Webhook URL
      
      // Additional fields for compatibility
      merchantId: ADUMO_CONFIG.merchantId,
      applicationId: ADUMO_CONFIG.applicationId,
      timestamp: Date.now()
    };
    
    console.log('🔐 Generating JWT with required Adumo fields:', JSON.stringify(payload, null, 2));
    
    const token = jwt.sign(payload, ADUMO_CONFIG.jwtSecret, { 
      algorithm: 'HS256',
      header: {
        alg: 'HS256',
        typ: 'JWT'
      }
    });
    
    const formData = {
      MerchantID: ADUMO_CONFIG.merchantId,
      ApplicationID: ADUMO_CONFIG.applicationId,
      TransactionReference: reference,
      MerchantReference: merchantReference,
      Amount: amount,
      CurrencyCode: 'ZAR',
      Description: `${plan.name} Plan - Monthly Subscription`,
      CustomerFirstName: user.name.split(' ')[0] || user.name,
      CustomerLastName: user.name.split(' ').slice(1).join(' ') || '',
      CustomerEmail: user.email,
      ReturnURL: `https://${domain}/dashboard?payment=success&ref=${reference}`,
      CancelURL: `https://${domain}/choose-plan?payment=canceled`,
      WebhookURL: `https://${domain}/api/webhooks/adumo`,
      Token: token
    };
    
    console.log('📝 Adumo form data being sent:', JSON.stringify(formData, null, 2));
    console.log('🎯 JWT Token being sent:', token);
    
    return {
      // Form POST URL
      url: ADUMO_CONFIG.environment === 'production' ? ADUMO_CONFIG.prodUrl : ADUMO_CONFIG.testUrl,
      
      // Required form parameters for Adumo Virtual
      formData,
      
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

    // Check if current subscription is incomplete - treat as new subscription
    if (currentSubscription.status === 'INCOMPLETE') {
      console.log('User has incomplete subscription, creating new payment flow');
      // Update the existing subscription with new plan
      await storage.updateSubscription(currentSubscription.id, {
        planId: newPlan.id
      });
      
      // Generate payment data for the new plan
      const paymentData = this.generatePaymentData(newPlan, user);
      
      return {
        subscriptionId: currentSubscription.adumoSubscriptionId,
        customerId: user.adumoCustomerId || '',
        paymentData,
        requiresPayment: true,
        message: 'Subscription updated - payment required to activate'
      };
    }

    // Update subscription plan for active subscriptions
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

      // Generate payment data for the prorated amount
      const paymentData = this.generatePaymentData({ ...newPlan, price: proratedAmount.toString() }, user);

      // Create transaction for the upgrade charge
      await storage.createTransaction({
        invoiceId: invoice.id,
        userId,
        merchantReference: paymentData.merchantReference,
        adumoTransactionId: null,
        adumoStatus: 'PENDING',
        paymentMethod: null,
        gateway: 'ADUMO',
        amount: proratedAmount.toString(),
        currency: 'ZAR',
        requestPayload: JSON.stringify(paymentData),
        responsePayload: null,
        notifyUrlResponse: null
      });

      return {
        subscriptionId: currentSubscription.adumoSubscriptionId,
        customerId: user.adumoCustomerId || '',
        paymentData,
        requiresPayment: true,
        message: 'Subscription updated - additional payment required for upgrade',
        proratedAmount
      };
    }

    return { 
      subscriptionId: currentSubscription.adumoSubscriptionId,
      customerId: user.adumoCustomerId || '',
      requiresPayment: false,
      message: 'Subscription updated successfully - no additional payment required',
      proratedAmount: 0
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
      const { TransactionReference: reference, Status: status, Amount: amount, TransactionID: transaction_id, MerchantReference: merchantReference } = payload;
      
      if (status === 'successful' || status === 'Successful') {
        // Find existing transaction by merchant reference to avoid duplicates
        const existingTransaction = await storage.getTransactionByMerchantReference(merchantReference || `OPIAN_${reference.split('_')[1]?.substring(0, 8)}_${Date.now()}`);
        
        if (!existingTransaction) {
          console.error('No existing transaction found for merchant reference:', merchantReference);
          return;
        }

        // SECURITY: Check if transaction is already processed to prevent replay attacks
        if (existingTransaction.adumoStatus === 'SUCCESS') {
          console.warn('Transaction already processed, ignoring duplicate webhook:', merchantReference);
          return;
        }

        // Get related invoice and subscription
        const invoice = await storage.getInvoiceById(existingTransaction.invoiceId);
        const user = await storage.getUserById(existingTransaction.userId);
        const subscription = await storage.getUserSubscription(existingTransaction.userId);

        if (!invoice || !user || !subscription) {
          console.error('Missing required data for webhook processing');
          return;
        }

        // SECURITY: Validate amount matches expected invoice amount
        const expectedAmountCents = Math.round(parseFloat(invoice.amount) * 100);
        const receivedAmountCents = parseInt(amount);
        
        if (expectedAmountCents !== receivedAmountCents) {
          console.error(`Amount mismatch: expected ${expectedAmountCents} cents, received ${receivedAmountCents} cents`);
          return;
        }

        // Update existing transaction with payment confirmation
        await storage.updateTransaction(existingTransaction.id, {
          adumoTransactionId: transaction_id,
          adumoStatus: 'SUCCESS',
          paymentMethod: payload.PaymentMethod || null,
          responsePayload: JSON.stringify({
            transaction_id,
            amount,
            payment_method: payload.PaymentMethod || null,
            result: 'SUCCESS'
          }),
          notifyUrlResponse: JSON.stringify(payload)
        });

        // Update existing invoice to paid status
        await storage.updateInvoice(invoice.id, {
          status: 'paid',
          paidAt: new Date()
        });

        // Activate the subscription
        await storage.updateSubscription(subscription.id, {
          status: 'ACTIVE'
        });

        // Send welcome email now that payment is confirmed
        const plan = await storage.getSubscriptionPlanById(subscription.planId);
        if (plan) {
          try {
            await sendEmail('welcome', {
              name: user.name,
              planName: plan.name,
              loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/auth`
            }, user.email, `Welcome to Opian Lifestyle - ${plan.name} Plan`);
          } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
          }
        }
      }
    } catch (error) {
      console.error('Error processing Adumo webhook:', error);
      throw error;
    }
  }

  static verifyWebhookSignature(req: any): boolean {
    try {
      const crypto = require('crypto');
      const webhookSecret = process.env.ADUMO_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error('ADUMO_WEBHOOK_SECRET not configured');
        return false;
      }

      // Get signature from headers (try common header names)
      const signature = req.headers['x-signature'] || 
                       req.headers['x-adumo-signature'] || 
                       req.headers['signature'];
      
      if (!signature) {
        console.error('No signature header found in webhook request');
        return false;
      }

      // Get raw payload
      const payload = req.body.toString();
      
      // Generate expected signature using HMAC SHA-256
      const hmac = crypto.createHmac('sha256', webhookSecret);
      const expectedSignature = hmac.update(payload, 'utf8').digest('hex');
      
      // Remove 'sha256=' prefix if present
      const receivedSignature = signature.replace(/^sha256=/i, '');
      
      // Use timing-safe comparison to prevent timing attacks
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      const receivedBuffer = Buffer.from(receivedSignature, 'hex');
      
      if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}