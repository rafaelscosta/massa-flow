/**
 * Identifies clients with a high cancellation risk.
 * @param {object} params - Parameters object.
 * @param {string} params.userId - The ID of the user whose clients are being analyzed.
 * @param {Array} params.allAppointments - List of all appointments from the DB.
 * @param {Array} params.allClients - List of all clients from the DB.
 * @param {number} [params.cancellationThreshold=0.3] - Minimum cancellation rate to be considered high risk.
 * @param {number} [params.minAppointments=3] - Minimum number of (attended + cancelled_by_client) appointments for a client to be evaluated.
 * @returns {Array} List of high-risk client objects.
 */
export function identifyHighCancellationRiskClients({
  userId,
  allAppointments,
  allClients,
  cancellationThreshold = 0.3,
  minAppointments = 3,
}) {
  if (!userId || !allAppointments || !allClients) {
    throw new Error("userId, allAppointments, and allClients are required.");
  }

  const userClients = allClients.filter(client => client.userId === userId);
  const highRiskClients = [];

  userClients.forEach(client => {
    const clientAppointments = allAppointments.filter(appt => appt.clientId === client.id && appt.userId === userId);

    const attendedCount = clientAppointments.filter(appt => appt.status === 'attended').length;
    const cancelledByClientCount = clientAppointments.filter(appt => appt.status === 'cancelled_by_client').length;
    
    const totalRelevantAppointments = attendedCount + cancelledByClientCount;

    if (totalRelevantAppointments >= minAppointments) {
      const cancellationRate = cancelledByClientCount / totalRelevantAppointments;
      if (cancellationRate >= cancellationThreshold) {
        highRiskClients.push({
          clientId: client.id,
          clientName: client.name,
          cancellationRate: parseFloat(cancellationRate.toFixed(2)), // Rounded to 2 decimal places
          attendedCount,
          cancelledByClientCount,
          totalRelevantAppointments,
        });
      }
    }
  });

  return highRiskClients;
}


/**
 * Calculates the health score for a specific client.
 * @param {object} params - Parameters object.
 * @param {string} params.userId - The ID of the user.
 * @param {string} params.clientId - The ID of the client.
 * @param {Array} params.allAppointments - List of all appointments from the DB.
 * @param {Array} params.allClients - List of all clients from the DB. (Not strictly needed if clientId is already validated)
 * @returns {object|null} Client health score object or null if client not found.
 */
export function calculateClientHealthScore({
  userId, // Included for consistency, could be used for user-specific scoring rules later
  clientId,
  allAppointments,
  allClients, // Can be used to fetch client details like name, or just for validation
}) {
import logger from './logger.js'; // Import the structured logger

/**
 * Identifies clients with a high cancellation risk.
 * @param {object} params - Parameters object.
 * @param {string} params.userId - The ID of the user whose clients are being analyzed.
 * @param {Array} params.allAppointments - List of all appointments from the DB.
 * @param {Array} params.allClients - List of all clients from the DB.
 * @param {number} [params.cancellationThreshold=0.3] - Minimum cancellation rate to be considered high risk.
 * @param {number} [params.minAppointments=3] - Minimum number of (attended + cancelled_by_client) appointments for a client to be evaluated.
 * @returns {Array} List of high-risk client objects.
 */
export function identifyHighCancellationRiskClients({
  userId,
  allAppointments,
  allClients,
  cancellationThreshold = 0.3,
  minAppointments = 3,
}) {
  if (!userId || !allAppointments || !allClients) {
    // Consider logging an error here if this is an unexpected state
    logger.error("identifyHighCancellationRiskClients: Missing required parameters.", null, { userId });
    throw new Error("userId, allAppointments, and allClients are required.");
  }

  const userClients = allClients.filter(client => client.userId === userId);
  const highRiskClients = [];
  logger.info('Starting high cancellation risk client identification.', { userId, clientCount: userClients.length, cancellationThreshold, minAppointments });

  userClients.forEach(client => {
    const clientAppointments = allAppointments.filter(appt => appt.clientId === client.id && appt.userId === userId);

    const attendedCount = clientAppointments.filter(appt => appt.status === 'attended').length;
    const cancelledByClientCount = clientAppointments.filter(appt => appt.status === 'cancelled_by_client').length;
    
    const totalRelevantAppointments = attendedCount + cancelledByClientCount;

    if (totalRelevantAppointments >= minAppointments) {
      const cancellationRate = cancelledByClientCount / totalRelevantAppointments;
      if (cancellationRate >= cancellationThreshold) {
        const riskData = {
          clientId: client.id,
          clientName: client.name,
          cancellationRate: parseFloat(cancellationRate.toFixed(2)), // Rounded to 2 decimal places
          attendedCount,
          cancelledByClientCount,
          totalRelevantAppointments,
        };
        highRiskClients.push(riskData);
        logger.info('High-risk client identified.', { userId, clientData: riskData });
      }
    }
  });
  logger.info(`High cancellation risk identification completed. Found ${highRiskClients.length} risky clients.`, { userId });
  return highRiskClients;
}


/**
 * Calculates the health score for a specific client.
 * @param {object} params - Parameters object.
 * @param {string} params.userId - The ID of the user.
 * @param {string} params.clientId - The ID of the client.
 * @param {Array} params.allAppointments - List of all appointments from the DB.
 * @param {Array} params.allClients - List of all clients from the DB. (Not strictly needed if clientId is already validated)
 * @returns {object|null} Client health score object or null if client not found.
 */
export function calculateClientHealthScore({
  userId, // Included for consistency, could be used for user-specific scoring rules later
  clientId,
  allAppointments,
  allClients, // Can be used to fetch client details like name, or just for validation
}) {
  if (!clientId || !allAppointments) {
    logger.error("calculateClientHealthScore: Missing required parameters clientId or allAppointments.", null, { userId, clientId });
    throw new Error("clientId and allAppointments are required.");
  }
  
  const client = allClients.find(c => c.id === clientId && c.userId === userId);
  if (!client) {
    logger.warn(`Client not found for health score calculation.`, { userId, clientId });
    return null; // Or throw error
  }
  logger.info('Starting client health score calculation.', { userId, clientId });

  const clientAppointments = allAppointments.filter(appt => appt.clientId === clientId && appt.userId === userId);
  let healthScore = 50; // Initial score
  const positiveFactors = [];
  const negativeFactors = [];
  const now = new Date();

  // Define time windows
  const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30));
  const ninetyDaysAgo = new Date(new Date().setDate(now.getDate() - 90));

  let recentAttendedPoints = 0;
  const MAX_RECENT_ATTENDED_POINTS = 30;
  let olderAttendedPoints = 0;
  const MAX_OLDER_ATTENDED_POINTS = 20;

  clientAppointments.forEach(appt => {
    const apptDate = new Date(appt.startDateTime);

    // Frequência e Recência
    if (appt.status === 'attended') {
      if (apptDate >= thirtyDaysAgo) {
        if (recentAttendedPoints < MAX_RECENT_ATTENDED_POINTS) {
          recentAttendedPoints += 10;
          positiveFactors.push(`Attended recently (${apptDate.toLocaleDateString('pt-BR')})`);
        }
      } else if (apptDate >= ninetyDaysAgo) {
        if (olderAttendedPoints < MAX_OLDER_ATTENDED_POINTS) {
          olderAttendedPoints += 5;
          positiveFactors.push(`Attended in last 3 months (${apptDate.toLocaleDateString('pt-BR')})`);
        }
      }
    }

    // Penalidades (within last 90 days)
    if (apptDate >= ninetyDaysAgo) {
      if (appt.status === 'no_show') {
        healthScore -= 15;
        negativeFactors.push(`No-show on ${apptDate.toLocaleDateString('pt-BR')}`);
      } else if (appt.status === 'cancelled_by_client') {
        healthScore -= 5;
        negativeFactors.push(`Cancelled by client on ${apptDate.toLocaleDateString('pt-BR')}`);
      }
    }
  });

  healthScore += Math.min(recentAttendedPoints, MAX_RECENT_ATTENDED_POINTS);
  healthScore += Math.min(olderAttendedPoints, MAX_OLDER_ATTENDED_POINTS);
  
  // Ensure score is within 0-100
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    clientId: client.id,
    clientName: client.name,
    healthScore: Math.round(healthScore), // Round to nearest integer
    positiveFactors: positiveFactors.length > 0 ? positiveFactors : ['No recent positive activity'],
    negativeFactors: negativeFactors.length > 0 ? negativeFactors : ['No recent negative activity'],
    // Could add more details like total appointments, last seen date etc.
  };
}


/**
 * Checks user metrics and generates alerts/tasks if certain thresholds are met.
 * @param {object} params - Parameters object.
 * @param {string} params.userId - The ID of the user.
 * @param {object} params.metrics - Calculated metrics object (e.g., from calculateDashboardMetrics).
 * @param {Array} params.allAppointments - List of all appointments for the user (for context like total count).
 * @param {Function} params.addTherapistTask - Function to add a task to the DB.
 * @param {number} [params.lowAttendanceThreshold=0.6] - Threshold below which attendance rate is considered low.
 * @param {number} [params.minAppointmentsForAttendanceAlert=5] - Min appointments to trigger attendance alert.
 */
export function checkMetricsAndGenerateAlerts({
  userId,
  metrics,
  allAppointments, // Used for context like total appointments
  addTherapistTask, // Pass the function directly
  lowAttendanceThreshold = 0.6, // Default: 60%
  minAppointmentsForAttendanceAlert = 5,
}) {
  if (!userId || !metrics || !allAppointments || typeof addTherapistTask !== 'function') {
    console.error("checkMetricsAndGenerateAlerts: Missing required parameters or addTherapistTask is not a function.");
    return;
  }

  // 1. Low Attendance Rate Alert
  // Count only 'attended' and 'no_show' for relevance to attendance rate calculation context
  const relevantAppointmentsCount = allAppointments.filter(
    appt => appt.userId === userId && (appt.status === 'attended' || appt.status === 'no_show')
  ).length;

  if (relevantAppointmentsCount >= minAppointmentsForAttendanceAlert) {
    if (metrics.attendanceRate < lowAttendanceThreshold) {
      const message = `Atenção: Sua taxa de presença está em ${(metrics.attendanceRate * 100).toFixed(0)}% nos últimos ${relevantAppointmentsCount} agendamentos relevantes. Considere revisar suas estratégias de confirmação ou comunicação com clientes.`;
      addTherapistTask({
        id: `task_metric_att_${Date.now()}`,
        userId,
        type: 'low_attendance_rate_alert',
        message,
        status: 'new',
        relatedEntityId: 'dashboard_metric_attendance', // Generic ID for this type of metric
        createdAt: new Date().toISOString(),
      });
      console.log(`INTELLIGENCE: Low attendance rate alert generated for user ${userId}.`);
      // trackEvent can also be called here if desired
    }
  }

  // Future: Add more metric-based alerts here (e.g., low revenue per client, high no-show numbers directly)
}
