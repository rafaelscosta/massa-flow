import { addSupportTicket, findUserById, getSupportTicketsByUserId } from '../../../lib/db';
import { trackEvent } from '../../../lib/analytics';
import logger from '../../../lib/logger';
import { httpRequestsTotal, httpRequestDurationSeconds, apiErrorsTotal } from '../../../lib/metrics';

async function handlePostRequest(req, res, route, method) {
  const { userId, subject, description, category, priority } = req.body;
  const requestContext = { userId, subject, category, priority, route, method };

  if (!userId || !subject || !description || !category || !priority) {
    logger.warn('Missing required fields for support ticket creation.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'validation_error', status_code: 400 });
    return res.status(400).json({ message: 'Missing required fields: userId, subject, description, category, and priority.' });
  }

  const user = findUserById(userId);
  if (!user) {
    logger.warn('User not found for support ticket creation.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'not_found', status_code: 404 });
    return res.status(404).json({ message: `User with ID ${userId} not found.` });
  }

  logger.info('Attempting to create support ticket.', requestContext);
  try {
    const now = new Date().toISOString();
    const newTicketData = { userId, subject, description, category, priority, status: 'open', createdAt: now, updatedAt: now };
    const newTicket = addSupportTicket(newTicketData);

    logger.info(`[Suporte Simulado] Novo ticket criado.`, { ticketId: newTicket.id, userId: newTicket.userId, subject: newTicket.subject });
    trackEvent('support_ticket_created', { userId, ticketId: newTicket.id, category: newTicket.category, priority: newTicket.priority });
    
    res.status(201).json(newTicket);
  } catch (error) {
    logger.error('Error creating support ticket.', error, requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'internal_server_error', status_code: 500 });
    res.status(500).json({ message: 'Error creating support ticket', error: error.message });
  }
}

async function handleGetRequest(req, res, route, method) {
  const { userId } = req.query;
  const requestContext = { userId, route, method };

  if (!userId) {
    logger.warn('userId query parameter is required for fetching support tickets.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'validation_error', status_code: 400 });
    return res.status(400).json({ message: 'userId query parameter is required.' });
  }

  const user = findUserById(userId);
  if (!user) {
    logger.warn('User not found when fetching support tickets.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'not_found', status_code: 404 });
    return res.status(404).json({ message: `User with ID ${userId} not found.` });
  }
  
  logger.info('Fetching support tickets for user.', requestContext);
  try {
    const tickets = getSupportTicketsByUserId(userId);
    logger.info(`Successfully fetched ${tickets.length} support tickets.`, requestContext);
    res.status(200).json(tickets);
  } catch (error) {
    logger.error('Error fetching support tickets.', error, requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'internal_server_error', status_code: 500 });
    res.status(500).json({ message: 'Error fetching support tickets', error: error.message });
  }
}

export default async function handler(req, res) {
  const { method } = req;
  const route = req.url || '/api/support/tickets';
  const endTimer = httpRequestDurationSeconds.startTimer({ method, route });
  let statusCode = 500; // Default for unhandled paths or errors

  try {
    if (method === 'POST') {
      await handlePostRequest(req, res, route, method);
      statusCode = res.statusCode;
    } else if (method === 'GET') {
      await handleGetRequest(req, res, route, method);
      statusCode = res.statusCode;
    } else {
      logger.warn(`Method ${method} not allowed for ${route}.`);
      statusCode = 405;
      apiErrorsTotal.inc({ route, method, error_type: 'method_not_allowed', status_code: statusCode });
      res.setHeader('Allow', ['POST', 'GET']);
      res.status(statusCode).end(`Method ${method} Not Allowed`);
    }
  } catch (e) {
    logger.error('Unhandled exception in support tickets handler.', e, { route, method });
    apiErrorsTotal.inc({ route, method, error_type: 'unhandled_handler_exception', status_code: statusCode });
    if (!res.headersSent) {
      res.status(statusCode).json({ message: "Internal Server Error" });
    }
  } finally {
    endTimer();
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }
}
