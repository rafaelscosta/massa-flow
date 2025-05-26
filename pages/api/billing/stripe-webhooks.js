import stripe from '../../../lib/stripeClient';
import { users, findUserById } from '../../../lib/db'; // Your in-memory DB
import { buffer } from 'micro'; // Required for parsing raw body for webhook verification

import stripe from '../../../lib/stripeClient';
import { users, findUserById } from '../../../lib/db'; // Your in-memory DB
import { buffer } from 'micro'; // Required for parsing raw body for webhook verification
import logger from '../../../lib/logger'; // Import the structured logger

// Helper to update user in the 'users' array (simulated DB)
const updateUserSubscriptionDetails = (userId, updates) => {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updates };
    logger.info(`User subscription details updated by webhook in DB_SIM`, { userId, updates });
    return users[userIndex];
  }
  logger.error(`Failed to update user subscription by webhook in DB_SIM, user not found.`, null, { userId });
  return null;
};

// Helper to map Stripe Price ID to your internal tier names
const getTierFromPriceId = (stripePriceId) => {
  if (stripePriceId === process.env.STRIPE_PRICE_ID_ESSENCIAL) return 'essencial';
  if (stripePriceId === process.env.STRIPE_PRICE_ID_PROFISSIONAL) return 'profissional';
  if (stripePriceId === process.env.STRIPE_PRICE_ID_PREMIUM) return 'premium';
  logger.warn(`Unknown Stripe Price ID encountered in webhook: ${stripePriceId}`, { stripePriceId });
  return 'unknown_tier'; 
};

// Disable Next.js body parsing for this route, as Stripe requires the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { method } = req;
  const route = req.url;

  if (method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_PLACEHOLDER_MISSING_ENV_VAR';

    if (webhookSecret === 'whsec_PLACEHOLDER_MISSING_ENV_VAR') {
        logger.error("STRIPE_WEBHOOK_SECRET is not set. Cannot process webhook.", null, { route });
        return res.status(500).send('Webhook secret not configured.');
    }
    
    let event;

    try {
      event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed.', err, { route });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    logger.info('Received Stripe webhook event', { eventType: event.type, eventId: event.id, route });

    // Handle the event
    try {
      let massaflowUserId;
      let stripeCustomerId;
      let subscription;
      let user;

      switch (event.type) {
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          stripeCustomerId = invoice.customer;
          subscription = invoice.subscription; 
          
          const stripeSubscription = await stripe.subscriptions.retrieve(subscription);
          logger.info('Processing invoice.payment_succeeded', { stripeCustomerId, subscriptionId: subscription, route });

          user = users.find(u => u.stripeCustomerId === stripeCustomerId);
          if (user) {
            massaflowUserId = user.id;
            const priceId = stripeSubscription.items.data[0].price.id;
            const tier = getTierFromPriceId(priceId);
            
            updateUserSubscriptionDetails(massaflowUserId, {
              subscriptionStatus: 'active',
              subscriptionTier: tier, 
              stripeSubscriptionId: subscription,
            });
            logger.info(`Payment succeeded for user, tier updated.`, { massaflowUserId, tier, route });
          } else {
            logger.warn(`User not found for stripeCustomerId during invoice.payment_succeeded.`, { stripeCustomerId, route });
          }
          break;

        case 'customer.subscription.deleted':
        case 'customer.subscription.updated': 
          subscription = event.data.object;
          stripeCustomerId = subscription.customer;
          logger.info(`Processing ${event.type}`, { stripeCustomerId, subscriptionId: subscription.id, subscriptionStatus: subscription.status, route });
          user = users.find(u => u.stripeCustomerId === stripeCustomerId);

          if (user) {
            massaflowUserId = user.id;
            if (subscription.status === 'canceled' || event.type === 'customer.subscription.deleted' || subscription.cancel_at_period_end) {
              updateUserSubscriptionDetails(massaflowUserId, {
                subscriptionStatus: 'cancelled', 
                subscriptionTier: 'free', 
              });
              logger.info(`Subscription cancelled for user.`, { massaflowUserId, route });
            } else if (subscription.status === 'active') {
                const priceId = subscription.items.data[0].price.id;
                const tier = getTierFromPriceId(priceId);
                updateUserSubscriptionDetails(massaflowUserId, {
                    subscriptionStatus: 'active',
                    subscriptionTier: tier,
                });
                logger.info(`Subscription updated for user. New tier: ${tier}`, { massaflowUserId, tier, route });
            } else {
                 updateUserSubscriptionDetails(massaflowUserId, {
                    subscriptionStatus: subscription.status, 
                 });
                 logger.info(`Subscription status updated to ${subscription.status} for user.`, { massaflowUserId, status: subscription.status, route });
            }
          } else {
            logger.warn(`User not found for stripeCustomerId during ${event.type}.`, { stripeCustomerId, route });
          }
          break;
        
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          stripeCustomerId = failedInvoice.customer;
          logger.info('Processing invoice.payment_failed', { stripeCustomerId, invoiceId: failedInvoice.id, route });
          user = users.find(u => u.stripeCustomerId === stripeCustomerId);
          if (user) {
            massaflowUserId = user.id;
            updateUserSubscriptionDetails(massaflowUserId, {
              subscriptionStatus: 'past_due',
            });
            logger.info(`Payment failed for user. Status set to past_due.`, { massaflowUserId, route });
          } else {
            logger.warn(`User not found for stripeCustomerId during invoice.payment_failed.`, { stripeCustomerId, route });
          }
          break;
        
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`, { eventId: event.id, route });
      }
      res.status(200).json({ received: true });
    } catch (error) {
        logger.error("Error processing webhook event.", error, { eventType: event.type, eventId: event.id, route });
        res.status(200).json({ received: true, error: "Internal server error processing webhook." });
    }

  } else {
    logger.warn(`Method ${method} not allowed for ${route}`);
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}
