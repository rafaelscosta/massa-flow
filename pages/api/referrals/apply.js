import { users, findUserById, saveAllDynamicData } from '../../../lib/db'; // Added saveAllDynamicData
import { trackEvent } from '../../../lib/analytics';
import logger from '../../../lib/logger';
import { httpRequestsTotal, httpRequestDurationSeconds, apiErrorsTotal } from '../../../lib/metrics';

async function applyReferralHandler(req, res) {
  const { userId, referralCodeAttempt } = req.body;
  const route = req.url || '/api/referrals/apply';
  const method = req.method;
  const requestContext = { userId, referralCodeAttempt, route, method };

  if (!userId || !referralCodeAttempt) {
    logger.warn('Missing required fields for applying referral code.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'validation_error', status_code: 400 });
    return res.status(400).json({ success: false, message: 'userId e referralCodeAttempt são obrigatórios.' });
  }

  const applyingUser = findUserById(userId);
  if (!applyingUser) {
    logger.warn('Applying user not found.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'not_found', status_code: 404 });
    return res.status(404).json({ success: false, message: `Usuário com ID ${userId} não encontrado.` });
  }

  if (applyingUser.referredByUserId) {
    logger.warn('User has already been referred.', { ...requestContext, referredByUserId: applyingUser.referredByUserId });
    apiErrorsTotal.inc({ route, method, error_type: 'business_logic_error', status_code: 400 });
    return res.status(400).json({ success: false, message: 'Este usuário já foi indicado anteriormente.' });
  }

  const referrerUser = users.find(u => u.referralCode === referralCodeAttempt);
  if (!referrerUser) {
    logger.warn('Referrer user not found by referral code.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'not_found', status_code: 404 });
    return res.status(404).json({ success: false, message: 'Código de referência inválido ou não encontrado.' });
  }

  if (referrerUser.id === applyingUser.id) {
    logger.warn('Self-referral attempt.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'business_logic_error', status_code: 400 });
    return res.status(400).json({ success: false, message: 'Auto-indicação não é permitida.' });
  }
  
  logger.info('Attempting to apply referral code.', requestContext);
  try {
    applyingUser.referredByUserId = referrerUser.id;
    applyingUser.updatedAt = new Date().toISOString();

    if (!referrerUser.successfulReferrals) referrerUser.successfulReferrals = [];
    referrerUser.successfulReferrals.push(applyingUser.id);
    referrerUser.updatedAt = new Date().toISOString();

    logger.info('Referral code applied successfully in DB_SIM.', { 
      applyingUserId: applyingUser.id, 
      referrerUserId: referrerUser.id, 
      referrerSuccessfulReferrals: referrerUser.successfulReferrals.length 
    });
    
    trackEvent('referral_code_applied', { applyingUserId: applyingUser.id, referrerUserId: referrerUser.id, code: referralCodeAttempt });
    logger.info('[Referral Simulado] Benefício aplicado (simulado).', { applyingUserId: applyingUser.id, referrerUserId: referrerUser.id });

    res.status(200).json({ success: true, message: 'Código de referência aplicado com sucesso! Benefícios simulados.' });
  } catch (error) {
    logger.error('Error applying referral code.', error, requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'internal_server_error', status_code: 500 });
    res.status(500).json({ success: false, message: 'Erro ao aplicar código de referência.', error: error.message });
  }
}

export default async function handler(req, res) {
  const { method } = req;
  const route = req.url || '/api/referrals/apply';
  const endTimer = httpRequestDurationSeconds.startTimer({ method, route });
  let statusCode = 500;

  try {
    if (method === 'POST') {
      await applyReferralHandler(req, res);
      statusCode = res.statusCode;
    } else {
      logger.warn(`Method ${method} not allowed for ${route}.`);
      statusCode = 405;
      apiErrorsTotal.inc({ route, method, error_type: 'method_not_allowed', status_code: statusCode });
      res.setHeader('Allow', ['POST']);
      res.status(statusCode).end(`Method ${method} Not Allowed`);
    }
  } catch (e) {
    logger.error('Unhandled exception in apply referral handler wrapper.', e, { route, method });
    apiErrorsTotal.inc({ route, method, error_type: 'unhandled_wrapper_exception', status_code: statusCode });
    if (!res.headersSent) {
      res.status(statusCode).json({ message: "Internal Server Error" });
    }
  } finally {
    endTimer();
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }
}
