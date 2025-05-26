import { findUserById } from '../../../lib/db';
import logger from '../../../lib/logger';
import { httpRequestsTotal, httpRequestDurationSeconds, apiErrorsTotal } from '../../../lib/metrics';

async function getReferralInfoHandler(req, res) {
  const { userId } = req.query;
  const route = req.url || '/api/referrals/info';
  const method = req.method;
  const requestContext = { userId, route, method };

  if (!userId) {
    logger.warn('userId query parameter is required for referral info.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'validation_error', status_code: 400 });
    return res.status(400).json({ message: 'userId query parameter is required.' });
  }

  const user = findUserById(userId);
  if (!user) {
    logger.warn('User not found when fetching referral info.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'not_found', status_code: 404 });
    return res.status(404).json({ message: `User with ID ${userId} not found.` });
  }
  
  logger.info('Fetching referral info for user.', requestContext);
  // findUserById ensures referral fields are initialized
  const referralsMadeCount = user.successfulReferrals ? user.successfulReferrals.length : 0;
  const responsePayload = {
    referralCode: user.referralCode,
    referralsMadeCount: referralsMadeCount,
  };
  
  logger.info('Referral info retrieved successfully.', { ...requestContext, data: responsePayload });
  res.status(200).json(responsePayload);
}

export default async function handler(req, res) {
  const { method } = req;
  const route = req.url || '/api/referrals/info';
  const endTimer = httpRequestDurationSeconds.startTimer({ method, route });
  let statusCode = 500;

  try {
    if (method === 'GET') {
      await getReferralInfoHandler(req, res);
      statusCode = res.statusCode;
    } else {
      logger.warn(`Method ${method} not allowed for ${route}.`);
      statusCode = 405;
      apiErrorsTotal.inc({ route, method, error_type: 'method_not_allowed', status_code: statusCode });
      res.setHeader('Allow', ['GET']);
      res.status(statusCode).end(`Method ${method} Not Allowed`);
    }
  } catch (e) {
    logger.error('Unhandled exception in referral info handler wrapper.', e, { route, method });
    apiErrorsTotal.inc({ route, method, error_type: 'unhandled_wrapper_exception', status_code: statusCode });
    if (!res.headersSent) {
      res.status(statusCode).json({ message: "Internal Server Error" });
    }
  } finally {
    endTimer();
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }
}
