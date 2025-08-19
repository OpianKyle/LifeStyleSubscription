import Stripe from 'stripe';
import { storage } from '../storage.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');

  const plans = [
    {
      name: 'OPPORTUNITY',
      price: 35000, // R350.00 in cents
      description: 'Essential protection for everyday life',
      features: ['EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Funeral Cover', 'Accidental Death Cover', 'Funeral Assist', 'Family Income Benefit', 'Lawyer Assist', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services']
    },
    {
      name: 'MOMENTUM',
      price: 45000, // R450.00 in cents
      description: 'Enhanced protection with increased coverage',
      features: ['Funeral Cover: R5,000', 'Funeral Assist', 'EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Accidental Death Cover', 'Family Income Benefit', 'Lawyer Assist', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services']
    },
    {
      name: 'PROSPER',
      price: 55000, // R550.00 in cents
      description: 'Comprehensive protection for growing families',
      features: ['Funeral Cover: R10,000', 'Accidental Death Cover: R20,000', 'Funeral Assist', 'Family Income Benefit: R5,000 x6', 'EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Virtual GP Assistant', 'Medical Second Opinion', 'Lawyer Assist', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services']
    },
    {
      name: 'PRESTIGE',
      price: 69500, // R695.00 in cents
      description: 'Premium protection with superior benefits',
      features: ['Funeral Cover: R15,000', 'Accidental Death Cover: R50,000', 'Funeral Assist', 'Family Income Benefit: R5,000 x6', 'EMS Assist', 'Legal Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services', 'Lawyer Assist']
    },
    {
      name: 'PINNACLE',
      price: 82500, // R825.00 in cents
      description: 'Ultimate protection with maximum coverage',
      features: ['Funeral Cover: R20,000', 'Accidental Death Cover: R100,000', 'Funeral Assist', 'Family Income Benefit: R5,000 x6', 'EMS Assist', 'Legal Assist', 'Lawyer Assist', 'Repatriation Cover', 'Celebrate Life', '24/7 Nurse On-Call', 'Virtual GP Assistant', 'Medical Second Opinion', 'Crime Victim Assist', 'Assault & Trauma Assist', 'Emergency Medical Services']
    }
  ];

  for (const planData of plans) {
    try {
      // Create Stripe product
      const product = await stripe.products.create({
        name: `Opian Lifestyle ${planData.name}`,
        description: planData.description,
        metadata: {
          planName: planData.name,
          features: JSON.stringify(planData.features)
        }
      });

      console.log(`Created product: ${product.id} for ${planData.name}`);

      // Create Stripe price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: planData.price,
        currency: 'zar',
        recurring: {
          interval: 'month'
        },
        metadata: {
          planName: planData.name
        }
      });

      console.log(`Created price: ${price.id} for ${planData.name}`);

      // Update database plan with Stripe IDs
      const dbPlan = await storage.getSubscriptionPlanByName(planData.name);
      if (dbPlan) {
        await storage.updateSubscriptionPlan(dbPlan.id, {
          stripeProductId: product.id,
          stripePriceId: price.id
        });
        console.log(`Updated database plan ${planData.name} with Stripe IDs`);
      }

    } catch (error) {
      console.error(`Error creating Stripe product/price for ${planData.name}:`, error);
    }
  }

  console.log('Stripe products and prices creation completed!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createStripeProducts().catch(console.error);
}