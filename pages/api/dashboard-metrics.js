import { appointments as allAppointments, communicationLogs as allCommunicationLogs, findUserById } from '../../lib/db';
import {
import { allAppointments, allCommunicationLogs, findUserById, addTherapistTask } from '../../lib/db';
import {
  calculateAttendanceRate,
  calculateTotalRevenueGenerated,
  calculateAdminTimeSaved,
} from '../../lib/metricsCalculator';
import { checkMetricsAndGenerateAlerts } from '../../lib/intelligenceEngine';
import logger from '../../lib/logger';
import { httpRequestsTotal, httpRequestDurationSeconds, apiErrorsTotal } from '../../lib/metrics';


async function dashboardMetricsHandler(req, res) {
  // This is the core logic of your original handler
  const { userId } = req.query;
  const route = req.url || '/api/dashboard-metrics'; // For logging/metrics
  const method = req.method;

  if (!userId) {
    logger.warn('userId query parameter is required for dashboard-metrics.', { route, userId });
    apiErrorsTotal.inc({ route, method, error_type: 'validation_error', status_code: 400 });
    return res.status(400).json({ message: 'userId query parameter is required' });
  }

  const user = findUserById(userId);
  if (!user) {
    logger.warn('User not found for dashboard-metrics.', { route, userId });
    apiErrorsTotal.inc({ route, method, error_type: 'not_found', status_code: 404 });
    return res.status(404).json({ message: `User with ID ${userId} not found.` });
  }

  logger.info('Fetching dashboard metrics.', { route, userId });
  const userAppointments = allAppointments.filter(appt => appt.userId === userId);
  const userCommunicationLogs = allCommunicationLogs.filter(log => log.userId === userId);

  try {
    const metrics = {
      attendanceRate: calculateAttendanceRate(userId, userAppointments),
      totalRevenueGenerated: calculateTotalRevenueGenerated(userId, userAppointments),
      adminTimeSavedHours: calculateAdminTimeSaved(userId, userCommunicationLogs),
    };

    checkMetricsAndGenerateAlerts({
      userId,
      metrics,
      allAppointments: userAppointments,
      addTherapistTask,
    });
    
    logger.info('Dashboard metrics calculated successfully.', { route, userId, metrics });
    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Error calculating dashboard metrics or generating alerts.', error, { route, userId });
    apiErrorsTotal.inc({ route, method, error_type: 'internal_server_error', status_code: 500 });
    res.status(500).json({ message: 'Error calculating dashboard metrics or generating alerts', error: error.message });
  }
}

export default async function handler(req, res) {
  const { method } = req;
  const route = req.url || '/api/dashboard-metrics';
  const endTimer = httpRequestDurationSeconds.startTimer({ method, route });
  let statusCode = 500; // Default for unhandled paths or errors

  try {
    if (method === 'GET') {
      await dashboardMetricsHandler(req, res);
      statusCode = res.statusCode; // Capture status code set by the actual handler
    } else {
      logger.warn(`Method ${method} not allowed for ${route}.`);
      statusCode = 405;
      apiErrorsTotal.inc({ route, method, error_type: 'method_not_allowed', status_code: statusCode });
      res.setHeader('Allow', ['GET']);
      res.status(statusCode).end(`Method ${method} Not Allowed`);
    }
  } catch (e) {
    // This catch is for unexpected errors within this wrapper or if dashboardMetricsHandler re-throws
    logger.error('Unhandled exception in dashboard-metrics handler wrapper.', e, { route, method });
    apiErrorsTotal.inc({ route, method, error_type: 'unhandled_wrapper_exception', status_code: statusCode });
    if (!res.headersSent) {
      res.status(statusCode).json({ message: "Internal Server Error in wrapper" });
    }
  } finally {
    endTimer();
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }
}
