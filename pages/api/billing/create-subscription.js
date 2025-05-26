import stripe from '../../../lib/stripeClient'; // Your Stripe SDK instance
import { findUserById, users } from '../../../lib/db'; // Your in-memory DB functions

import stripe from '../../../lib/stripeClient'; // Your Stripe SDK instance
import { findUserById, users } from '../../../lib/db'; // Your in-memory DB functions
import logger from '../../../lib/logger'; // Import the structured logger

import { saveAllDynamicData } from '../../../lib/db'; // Import saveAllDynamicData

// Helper to update user in the 'users' array (simulated DB)
const updateUserSubscriptionDetails = (userId, updates) => {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updates };
    logger.info(`User subscription details updated in DB_SIM`, { userId, updates });
    saveAllDynamicData(); // Persist changes to users.json
    return users[userIndex];
  }
  logger.error(`Failed to update user subscription details in DB_SIM, user not found.`, null, { userId });
  return null;
};

// Helper to map Stripe Price ID to your internal tier names
const getTierFromPriceId = (stripePriceId) => {
  // These should correspond to the IDs you set in your environment variables
  if (stripePriceId === process.env.STRIPE_PRICE_ID_ESSENCIAL) return 'essencial';
  if (stripePriceId === process.env.STRIPE_PRICE_ID_PROFISSIONAL) return 'profissional';
  if (stripePriceId === process.env.STRIPE_PRICE_ID_PREMIUM) return 'premium';
  logger.warn(`Unknown Stripe Price ID encountered: ${stripePriceId}`);
  return 'unknown_tier'; // Fallback
};

export default async function handler(req, res) {
  const { method } = req;
  const route = req.url; // Or derive a more specific route identifier

  if (method === 'POST') {
    const { userId, stripePriceId, userEmail } = req.body;

    if (!userId || !stripePriceId || !userEmail) {
      logger.warn('Missing required fields for create-subscription', { userId, stripePriceId, userEmailPresent: !!userEmail, route });
      return res.status(400).json({ message: 'userId, stripePriceId, and userEmail are required.' });
    }

    const user = findUserById(userId);
    if (!user) {
      logger.warn('User not found for create-subscription', { userId, route });
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }
    
    logger.info('Attempting to create Stripe subscription', { userId, stripePriceId, userEmail, route });

    try {
      let stripeCustomerId = user.stripeCustomerId;

      // 1. Create or retrieve Stripe Customer
      if (!stripeCustomerId) {
        logger.info('Stripe Customer ID not found for user, attempting to create/retrieve.', { userId, userEmail, route });
        const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
          logger.info('Existing Stripe Customer found by email.', { userId, stripeCustomerId, route });
        } else {
          const customer = await stripe.customers.create({
            email: userEmail,
            name: user.name,
            metadata: { massaflowUserId: userId },
          });
          stripeCustomerId = customer.id;
          logger.info('New Stripe Customer created.', { userId, stripeCustomerId, route });
        }
        updateUserSubscriptionDetails(userId, { stripeCustomerId });
      } else {
        logger.info('Using existing Stripe Customer ID for user.', { userId, stripeCustomerId, route });
      }

      // 2. Create the Subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: { massaflowUserId: userId },
      });
      logger.info('Stripe subscription created.', { userId, subscriptionId: subscription.id, status: subscription.status, route });


      // 3. Update your database with subscription details
      const tier = getTierFromPriceId(stripePriceId);
      updateUserSubscriptionDetails(userId, {
        stripeSubscriptionId: subscription.id,
        subscriptionTier: tier,
        subscriptionStatus: subscription.status,
      });

      // 4. Return subscriptionId and client_secret (if payment is required)
      if (subscription.latest_invoice?.payment_intent?.client_secret) {
        logger.info('Subscription requires payment, returning client_secret.', { userId, subscriptionId: subscription.id, route });
        res.status(200).json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice.payment_intent.client_secret,
          status: subscription.status,
        });
      } else {
        logger.warn('Subscription created but no payment_intent client_secret found.', { userId, subscriptionId: subscription.id, subscriptionStatus: subscription.status, route });
        res.status(200).json({
            subscriptionId: subscription.id,
            clientSecret: null,
            status: subscription.status,
        });
      }
    } catch (error) {
      logger.error('Stripe API error during subscription creation.', error, { userId, stripePriceId, route });
      res.status(500).json({ message: 'Error creating subscription', error: error.message });
    }
  } else {
    logger.warn(`Method ${method} not allowed for ${route}`);
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
  }
}
