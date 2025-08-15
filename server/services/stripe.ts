import Stripe from 'stripe';
import { storage } from '../storage';
import { sendEmail } from './email';

// Initialize Stripe only if we have the secret key
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export class StripeService {
  static async createOrGetCustomer(userId: string, email: string, name: string) {
    const user = await storage.getUserById(userId);
    
    if (user?.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    if (!stripe) {
      throw new Error('Stripe not initialized. Please configure STRIPE_SECRET_KEY.');
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId }
    });

    await storage.updateUser(userId, { stripeCustomerId: customer.id });
    return customer.id;
  }

  static async createNewSubscription(userId: string, planName: string) {
    const user = await storage.getUserById(userId);
    const plan = await storage.getSubscriptionPlanByName(planName);
    
    if (!user || !plan) {
      throw new Error('User or plan not found');
    }

    if (!plan.stripePriceId) {
      throw new Error('Stripe price ID not configured for this plan');
    }

    // Check if this is a development price ID (for demo purposes)
    const isDevelopmentMode = plan.stripePriceId.startsWith('price_dev_');
    
    if (isDevelopmentMode) {
      // Development mode: Create subscription without Stripe
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const subscriptionData = {
        userId,
        planId: plan.id,
        stripeSubscriptionId: `sub_dev_${userId}_${Date.now()}`,
        status: 'ACTIVE' as const,
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth
      };

      const subscription = await storage.createSubscription(subscriptionData);
      
      // Update user with subscription ID
      await storage.updateUser(userId, { stripeSubscriptionId: subscriptionData.stripeSubscriptionId });

      return {
        subscriptionId: subscriptionData.stripeSubscriptionId,
        clientSecret: null,
        requiresPayment: false,
        message: 'Development subscription created successfully'
      };
    }

    // Production mode: Use actual Stripe
    if (!stripe) {
      throw new Error('Stripe not initialized. Please configure STRIPE_SECRET_KEY.');
    }

    const customerId = await this.createOrGetCustomer(userId, user.email, user.name);

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { userId, planId: plan.id }
    });

    // Store subscription in database with safe date handling
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const subscriptionData = {
      userId,
      planId: plan.id,
      stripeSubscriptionId: subscription.id,
      status: 'INCOMPLETE' as const,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth
    };

    await storage.createSubscription(subscriptionData);

    // Update user with subscription ID
    await storage.updateUser(userId, { stripeSubscriptionId: subscription.id });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = (invoice as any)?.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret || null,
      requiresPayment: true,
      invoice: invoice
    };
  }

  static async createSubscription(userId: string, planName: string) {
    try {
      const user = await storage.getUserById(userId);
      const plan = await storage.getSubscriptionPlanByName(planName);
      const existingSubscription = await storage.getUserSubscription(userId);
      
      if (!user || !plan) {
        throw new Error('User or plan not found');
      }

      if (!plan.stripePriceId) {
        throw new Error('Stripe price ID not configured for this plan');
      }

      // If user already has a subscription, check if it's the same plan
      if (existingSubscription) {
        const existingPlan = await storage.getSubscriptionPlanById(existingSubscription.planId);
        if (existingPlan?.name === planName) {
          throw new Error('You are already subscribed to this plan');
        }
        return await this.updateSubscription(userId, planName);
      }

      return await this.createNewSubscription(userId, planName);
    } catch (error) {
      throw error;
    }
  }

  static async updateSubscription(userId: string, newPlanName: string) {
    const user = await storage.getUserById(userId);
    const currentSubscription = await storage.getUserSubscription(userId);
    const newPlan = await storage.getSubscriptionPlanByName(newPlanName);
    
    if (!user || !currentSubscription || !newPlan) {
      throw new Error('User, subscription, or plan not found');
    }

    // Handle development subscriptions (which don't exist in Stripe)
    if (currentSubscription.stripeSubscriptionId!.startsWith('sub_dev_')) {
      // Cancel dev subscription and create new one
      await storage.cancelSubscription(currentSubscription.id);
      return this.createNewSubscription(userId, newPlanName);
    }

    if (!stripe) {
      throw new Error('Stripe not initialized. Please configure STRIPE_SECRET_KEY.');
    }

    let stripeSubscription;
    try {
      stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.stripeSubscriptionId!);
      
      // If current subscription is incomplete, cancel it and create a new one
      if (stripeSubscription.status === 'incomplete') {
        await stripe.subscriptions.cancel(currentSubscription.stripeSubscriptionId!);
        await storage.cancelSubscription(currentSubscription.id);
        
        // Create new subscription (but avoid the recursion)
        return this.createNewSubscription(userId, newPlanName);
      }
    } catch (stripeError: any) {
      // If subscription doesn't exist in Stripe, treat as new subscription
      if (stripeError.code === 'resource_missing') {
        await storage.cancelSubscription(currentSubscription.id);
        return this.createNewSubscription(userId, newPlanName);
      }
      throw stripeError;
    }
    
    // For active subscriptions, update normally
    await stripe.subscriptions.update(currentSubscription.stripeSubscriptionId!, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPlan.stripePriceId!
      }],
      proration_behavior: 'create_prorations'
    });

    // Update subscription in database
    await storage.updateSubscription(currentSubscription.id, {
      planId: newPlan.id
    });

    // Note: Email sending temporarily disabled due to SMTP configuration
    // await sendEmail('subscriptionChange', {
    //   name: user.name,
    //   oldPlan: currentSubscription.plan.name,
    //   newPlan: newPlan.name,
    //   changeDate: new Date().toLocaleDateString(),
    //   nextBilling: new Date(currentSubscription.currentPeriodEnd!).toLocaleDateString()
    // }, user.email, 'Your LifeGuard subscription has been updated');

    return { message: 'Subscription updated successfully' };
  }

  static async cancelSubscription(userId: string) {
    const user = await storage.getUserById(userId);
    const subscription = await storage.getUserSubscription(userId);
    
    if (!user || !subscription) {
      throw new Error('User or subscription not found');
    }

    if (!stripe) {
      throw new Error('Stripe not initialized. Please configure STRIPE_SECRET_KEY.');
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId!, {
      cancel_at_period_end: true
    });

    await storage.cancelSubscription(subscription.id);

    // Send subscription change email
    await sendEmail('subscriptionChange', {
      name: user.name,
      oldPlan: subscription.plan.name,
      newPlan: 'Canceled',
      changeDate: new Date().toLocaleDateString(),
      nextBilling: new Date(subscription.currentPeriodEnd!).toLocaleDateString()
    }, user.email, 'Your LifeGuard subscription has been canceled');

    return { message: 'Subscription canceled successfully' };
  }

  static async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private static async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    if (!stripe) {
      throw new Error('Stripe not initialized. Please configure STRIPE_SECRET_KEY.');
    }

    const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string);
    const userId = subscription.metadata.userId;
    const user = await storage.getUserById(userId);
    
    if (!user) return;

    // Create invoice record
    await storage.createInvoice({
      userId,
      stripeInvoiceId: invoice.id,
      amount: (invoice.amount_paid / 100).toString(),
      currency: invoice.currency.toUpperCase(),
      status: 'paid',
      paidAt: new Date(invoice.status_transitions?.paid_at ? invoice.status_transitions.paid_at * 1000 : Date.now())
    });

    // Update subscription status
    await storage.updateSubscription(subscription.metadata.planId, {
      status: 'ACTIVE',
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000)
    });

    // Send payment receipt email
    const plan = await storage.getSubscriptionPlanByName(subscription.metadata.planId);
    await sendEmail('paymentReceipt', {
      name: user.name,
      planName: plan?.name || 'Unknown',
      amount: `R${(invoice.amount_paid / 100).toFixed(2)}`,
      date: new Date().toLocaleDateString(),
      transactionId: invoice.id
    }, user.email, 'Payment receipt for your LifeGuard subscription');
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    // Handle failed payment logic
    console.log('Payment failed for invoice:', invoice.id);
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await storage.updateSubscription(subscription.metadata.planId, {
      status: subscription.status.toUpperCase() as any,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end
    });
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await storage.updateSubscription(subscription.metadata.planId, {
      status: 'CANCELED',
      canceledAt: new Date()
    });
  }
}
