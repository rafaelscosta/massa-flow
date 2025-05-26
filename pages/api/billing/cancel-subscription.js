import stripe from '../../../lib/stripeClient';
import { findUserById, users } from '../../../lib/db';
import logger from '../../../lib/logger'; // Import the structured logger

// Helper to update user in the 'users' array (simulated DB)
// This is not strictly needed if webhook handles all DB updates,
// but can be used for immediate feedback or local state.
// For now, we rely on webhooks for DB state changes, so this is commented out.
/*
const updateUserSubscriptionDetails = (userId, updates) => {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updates };
    logger.info(`User subscription details updated by cancel API in DB_SIM`, { userId, updates });
    return users[userIndex];
  }
  return null;
};
*/

export default async function handler(req, res) {
  const { method } = req;
  const route = req.url;

  if (method === 'POST') {
    const { userId } = req.body;
    const requestContext = { userId, route };

    if (!userId) {
      logger.warn('userId is required for cancel-subscription.', requestContext);
      return res.status(400).json({ message: 'userId is required.' });
    }

    const user = findUserById(userId);
    if (!user) {
      logger.warn('User not found for cancel-subscription.', requestContext);
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }

    if (!user.stripeSubscriptionId) {
      logger.warn('User does not have an active subscription to cancel.', { ...requestContext, stripeSubscriptionId: user.stripeSubscriptionId });
      return res.status(400).json({ message: 'User does not have an active subscription to cancel.' });
    }

    logger.info('Attempting to cancel Stripe subscription.', { ...requestContext, stripeSubscriptionId: user.stripeSubscriptionId });

    try {
      const deletedSubscription = await stripe.subscriptions.del(user.stripeSubscriptionId);
      logger.info('Stripe subscription cancelled successfully.', { ...requestContext, subscriptionId: deletedSubscription.id, status: deletedSubscription.status });
      
      // Webhooks will handle the actual DB update.
      // updateUserSubscriptionDetails(userId, { subscriptionStatus: 'cancelled', subscriptionTier: 'free' }); // Example optimistic update

      res.status(200).json({ 
        message: 'Subscription cancellation initiated successfully. Status will be updated via webhook.',
        subscriptionId: deletedSubscription.id,
        status: deletedSubscription.status
      });

    } catch (error) {
      logger.error('Stripe API error during subscription cancellation.', error, requestContext);
      res.status(500).json({ message: 'Error cancelling subscription', error: error.message });
    }
  } else {
    logger.warn(`Method ${method} not allowed for ${route}.`);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
