import { 
  users, 
  findUserById, 
  addTherapistTask,
  // Assume we have a way to update user's tool connection status in db.js
  users, 
  findUserById, 
  addTherapistTask,
} from '../../../lib/db'; 
import { trackEvent } from '../../../lib/analytics';
import logger from '../../../lib/logger';
import { httpRequestsTotal, httpRequestDurationSeconds, apiErrorsTotal } from '../../../lib/metrics';

// Helper to update tool status in the 'users' array (simulated DB)
const updateUserToolStatus = (userId, toolId, newStatus) => {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    if (!users[userIndex].tools) users[userIndex].tools = {};
    if (!users[userIndex].tools[toolId]) users[userIndex].tools[toolId] = {};
    users[userIndex].tools[toolId].connected = newStatus === 'connected';
    logger.info(`User tool connection status updated in DB_SIM.`, { userId, toolId, newStatus });
    return true;
  }
  logger.error(`Failed to update user tool status in DB_SIM, user not found.`, null, { userId, toolId });
  return false;
};


export default async function handler(req, res) {
  const { method } = req;
  const route = req.url || '/api/integrations/toggle-connection';
  const endTimer = httpRequestDurationSeconds.startTimer({ method, route });
  let statusCode = 500; // Default for unhandled paths or errors

  try {
    if (method === 'POST') {
      const { userId, toolId, toolName, desiredStatus } = req.body;
      const requestContext = { userId, toolId, toolName, desiredStatus, route };

      if (!userId || !toolId || !toolName || !desiredStatus) {
        logger.warn('Missing required fields for toggle-connection.', requestContext);
        statusCode = 400;
        apiErrorsTotal.inc({ route, method, error_type: 'validation_error', status_code: statusCode });
        return res.status(statusCode).json({ message: 'userId, toolId, toolName, and desiredStatus are required' });
      }

      const user = findUserById(userId);
      if (!user) {
        logger.warn('User not found for toggle-connection.', requestContext);
        statusCode = 404;
        apiErrorsTotal.inc({ route, method, error_type: 'not_found', status_code: statusCode });
        return res.status(statusCode).json({ message: `User with ID ${userId} not found.` });
      }
      
      logger.info('Attempting to toggle tool connection.', requestContext);

      // Simulate connection failure for 'email' tool when trying to connect
      if (toolId === 'email' && desiredStatus === 'connected') {
        logger.info('Simulating email connection failure.', requestContext);
        addTherapistTask({
          id: `task_tool_${Date.now()}`,
          userId, type: 'tool_connection_failed',
          message: `Falha ao tentar conectar a ferramenta '${toolName}'. Por favor, verifique as configurações e tente novamente ou contate o suporte.`,
          status: 'new', relatedEntityId: toolId, createdAt: new Date().toISOString(),
        });
        updateUserToolStatus(userId, toolId, 'disconnected'); 
        trackEvent('tool_connection_update_failed', { userId, tool_name: toolName, attempted_status: desiredStatus });
        
        statusCode = 422; // Unprocessable Entity
        apiErrorsTotal.inc({ route, method, error_type: 'simulated_tool_connection_failure', status_code: statusCode });
        return res.status(statusCode).json({ 
          message: `Falha simulada ao conectar ${toolName}. Uma tarefa foi criada.`,
          status: 'disconnected', task_created: true 
        });
      }

      // For other tools or disconnecting 'email', simulate success
      const success = updateUserToolStatus(userId, toolId, desiredStatus);
      if (success) {
        trackEvent('tool_connection_updated', { userId, tool_name: toolName, status: desiredStatus, context: 'integrations_page_api' });
        statusCode = 200;
        logger.info('Tool connection status updated successfully.', { ...requestContext, finalStatus: desiredStatus });
        res.status(statusCode).json({ message: `Status de ${toolName} atualizado para ${desiredStatus}.`, status: desiredStatus });
      } else {
        // This case implies user was found initially but updateUserToolStatus failed internally (should be rare with current DB sim)
        statusCode = 500;
        logger.error('Failed to update tool status despite user being found.', null, requestContext);
        apiErrorsTotal.inc({ route, method, error_type: 'internal_db_update_failure', status_code: statusCode });
        res.status(statusCode).json({ message: `Erro ao atualizar status de ${toolName}.`});
      }
    } else {
      logger.warn(`Method ${method} not allowed for ${route}.`);
      statusCode = 405;
      apiErrorsTotal.inc({ route, method, error_type: 'method_not_allowed', status_code: statusCode });
      res.setHeader('Allow', ['POST']);
      res.status(statusCode).end(`Method ${method} Not Allowed`);
    }
  } catch(e) {
    logger.error('Unhandled exception in toggle-connection handler.', e, { route, method });
    apiErrorsTotal.inc({ route, method, error_type: 'unhandled_handler_exception', status_code: statusCode });
    if (!res.headersSent) {
      res.status(statusCode).json({ message: "Internal Server Error" });
    }
  } finally {
    endTimer();
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }
}
