import { therapistTasks, findUserById } from '../../../../lib/db';
import logger from '../../../../lib/logger';
import { httpRequestsTotal, httpRequestDurationSeconds, apiErrorsTotal } from '../../../../lib/metrics';

async function updateTaskStatusHandler(req, res) {
  const { taskId } = req.query;
  const { userId, status: newStatus } = req.body;
  const route = `/api/tasks/${taskId}/status`; // Dynamic route for logging
  const method = req.method;
  const requestContext = { taskId, userId, newStatus, route, method };

  if (!userId) {
    logger.warn('userId is required in the request body for task status update.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'validation_error', status_code: 400 });
    return res.status(400).json({ message: 'userId is required in the request body for validation.' });
  }
  if (!newStatus) {
    logger.warn('New status is required in the request body for task status update.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'validation_error', status_code: 400 });
    return res.status(400).json({ message: 'New status is required in the request body.' });
  }
  
  const allowedStatuses = ['new', 'read', 'archived'];
  if (!allowedStatuses.includes(newStatus)) {
    logger.warn('Invalid status provided for task update.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'validation_error', status_code: 400 });
    return res.status(400).json({ message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(', ')}.` });
  }

  logger.info('Attempting to update task status.', requestContext);
  const taskIndex = therapistTasks.findIndex(task => task.id === taskId);

  if (taskIndex === -1) {
    logger.warn('Task not found for status update.', requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'not_found', status_code: 404 });
    return res.status(404).json({ message: `Task with ID ${taskId} not found.` });
  }

  if (therapistTasks[taskIndex].userId !== userId) {
    logger.warn('User forbidden from updating task status.', { ...requestContext, taskOwner: therapistTasks[taskIndex].userId });
    apiErrorsTotal.inc({ route, method, error_type: 'forbidden', status_code: 403 });
    return res.status(403).json({ message: 'Forbidden: You do not have permission to update this task.' });
  }

  try {
    therapistTasks[taskIndex].status = newStatus;
    therapistTasks[taskIndex].updatedAt = new Date().toISOString();

    logger.info('Task status updated successfully in DB_SIM.', { ...requestContext, updatedTask: therapistTasks[taskIndex] });
    res.status(200).json(therapistTasks[taskIndex]);
  } catch (error) {
    logger.error('Error updating task status.', error, requestContext);
    apiErrorsTotal.inc({ route, method, error_type: 'internal_server_error', status_code: 500 });
    res.status(500).json({ message: 'Error updating task status', error: error.message });
  }
}

export default async function handler(req, res) {
  const { method } = req;
  const { taskId } = req.query;
  const route = `/api/tasks/${taskId}/status`; // Construct route string for metrics
  const endTimer = httpRequestDurationSeconds.startTimer({ method, route });
  let statusCode = 500;

  try {
    if (method === 'PUT') {
      await updateTaskStatusHandler(req, res);
      statusCode = res.statusCode;
    } else {
      logger.warn(`Method ${method} not allowed for ${route}.`);
      statusCode = 405;
      apiErrorsTotal.inc({ route, method, error_type: 'method_not_allowed', status_code: statusCode });
      res.setHeader('Allow', ['PUT']);
      res.status(statusCode).end(`Method ${method} Not Allowed`);
    }
  } catch (e) {
    logger.error('Unhandled exception in update task status handler wrapper.', e, { route, method, taskId });
    apiErrorsTotal.inc({ route, method, error_type: 'unhandled_wrapper_exception', status_code: statusCode });
    if (!res.headersSent) {
      res.status(statusCode).json({ message: "Internal Server Error" });
    }
  } finally {
    endTimer();
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }
}
