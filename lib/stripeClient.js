import Stripe from 'stripe';
import logger from './logger'; // Import the structured logger

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER_MISSING_ENV_VAR';

if (stripeSecretKey === 'sk_test_PLACEHOLDER_MISSING_ENV_VAR' || !process.env.STRIPE_SECRET_KEY) {
  logger.warn(
    'STRIPE_SECRET_KEY environment variable is not set or is using the default placeholder. ' +
    'Stripe functionality will not work correctly. Please set it in your .env.local file.',
    { context: 'stripe_initialization' }
  );
} else {
  logger.info('Stripe secret key loaded successfully.', { context: 'stripe_initialization' });
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16', 
});

logger.info('Stripe client initialized.', { apiVersion: '2023-10-16' });

export default stripe;
