import { findUserById } from '../../../lib/db'; // Your in-memory DB functions
import logger from '../../../lib/logger'; // Import the structured logger

export default function handler(req, res) {
  const { method } = req;
  const route = req.url;

  if (method === 'GET') {
    const { userId } = req.query;
    const requestContext = { userId, route };

    if (!userId) {
      logger.warn('userId query parameter is required for subscription-status.', requestContext);
      return res.status(400).json({ message: 'userId query parameter is required.' });
    }

    const user = findUserById(userId);
    if (!user) {
      logger.warn('User not found for subscription-status.', requestContext);
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }
    
    logger.info('Fetching subscription status for user.', requestContext);

    // findUserById from db.js now handles initialization of billing fields.
    const responsePayload = {
      tier: user.subscriptionTier || 'free',
      status: user.subscriptionStatus || 'inactive',
      stripeCustomerId: user.stripeCustomerId,
      stripeSubscriptionId: user.stripeSubscriptionId,
    };
    
    logger.info('Subscription status retrieved successfully.', { ...requestContext, subscription: responsePayload });
    res.status(200).json(responsePayload);

  } else {
    logger.warn(`Method ${method} not allowed for ${route}.`);
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
