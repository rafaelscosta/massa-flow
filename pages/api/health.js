import { findUserById } from '../../lib/db';
import logger from '../../lib/logger';
import stripe from '../../lib/stripeClient';
import { httpRequestsTotal, httpRequestDurationSeconds, apiErrorsTotal } from '../../lib/metrics';

export default async function handler(req, res) {
  const { method } = req;
  const route = req.url || '/api/health'; // Ensure route is defined
  const endTimer = httpRequestDurationSeconds.startTimer({ method, route });
  let statusCode = 500; // Default to error for unhandled paths
  let overallStatus = 'UP';
  const checks = [];
  const timestamp = new Date().toISOString();

  try {
    if (method !== 'GET') {
      logger.warn(`Method ${method} not allowed for health check.`, { route });
      statusCode = 405;
      apiErrorsTotal.inc({ route, method, error_type: 'method_not_allowed', status_code: statusCode });
      res.setHeader('Allow', ['GET']);
      return res.status(statusCode).end('Method Not Allowed');
    }

    // Check 1: Database Simulation
    try {
      const user = findUserById('user1');
      if (user) {
        checks.push({ name: 'database_simulation', status: 'UP', details: 'Successfully read from in-memory DB.' });
      } else {
        overallStatus = 'DOWN';
        checks.push({ name: 'database_simulation', status: 'DOWN', error: 'User user1 not found in DB simulation.' });
        logger.error('Health check: User user1 not found in DB simulation.', null, { route });
        apiErrorsTotal.inc({ route, method, error_type: 'db_simulation_failure', status_code: 503 });
      }
    } catch (error) {
      overallStatus = 'DOWN';
      checks.push({ name: 'database_simulation', status: 'DOWN', error: error.message });
      logger.error('Health check: Error accessing database simulation.', error, { route });
      apiErrorsTotal.inc({ route, method, error_type: 'db_simulation_exception', status_code: 503 });
    }

    // Check 2: Stripe Configuration & Connectivity
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_PLACEHOLDER_MISSING_ENV_VAR') {
      try {
        await stripe.customers.list({ limit: 1 });
        checks.push({ name: 'stripe_connectivity', status: 'UP', details: 'Successfully connected to Stripe API.' });
      } catch (stripeError) {
        overallStatus = 'DEGRADED'; // Or 'DOWN'
        checks.push({ name: 'stripe_connectivity', status: 'DEGRADED', error: `Stripe API error: ${stripeError.message}`});
        logger.error('Health check: Stripe API connectivity failed.', stripeError, { route });
        apiErrorsTotal.inc({ route, method, error_type: 'stripe_api_failure', status_code: 503 });
      }
    } else {
      overallStatus = 'DEGRADED';
      checks.push({ name: 'stripe_configuration', status: 'DEGRADED', details: 'Stripe secret key is not properly configured.' });
      logger.warn('Health check: Stripe secret key not configured.', { route });
      // Not incrementing apiErrorsTotal here as it's a config issue, not an API error during request
    }
    
    // Check 3: Critical Environment Variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 
      'STRIPE_WEBHOOK_SECRET',
      'MASSAFLOW_VAULT_KEY',
      'MASSAFLOW_VAULT_IV'
    ];
    const missingVars = requiredEnvVars.filter(v => !process.env[v] || process.env[v].includes('PLACEHOLDER'));
    if (missingVars.length > 0) {
      overallStatus = 'DEGRADED';
      checks.push({ name: 'critical_env_vars', status: 'DEGRADED', details: `Missing critical environment variables: ${missingVars.join(', ')}`});
      logger.warn(`Health check: Missing critical environment variables: ${missingVars.join(', ')}`, { route, missingVars });
    } else {
      checks.push({ name: 'critical_env_vars', status: 'UP', details: 'All critical environment variables seem to be set.' });
    }

    statusCode = overallStatus === 'UP' ? 200 : 503;
    logger.info(`Health check performed. Overall status: ${overallStatus}`, { route, overallStatus, checks });
    res.status(statusCode).json({
      status: overallStatus,
      timestamp,
      checks,
    });

  } catch (e) { // Catch any unexpected error in the handler itself
    statusCode = 500;
    logger.error('Unexpected error in health check handler.', e, { route, method });
    apiErrorsTotal.inc({ route, method, error_type: 'unhandled_handler_exception', status_code: statusCode });
    if (!res.headersSent) {
      res.status(statusCode).json({ status: 'ERROR', message: 'Internal server error during health check.' });
    }
  } finally {
    endTimer();
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }
}
