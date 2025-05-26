import { appointments as allAppointments, communicationLogs as allCommunicationLogs, findUserById } from '../../lib/db';
import {
  calculateAttendanceRate,
  calculateTotalRevenueGenerated,
  calculateAdminTimeSaved,
} from '../../lib/metricsCalculator';
import { checkMetricsAndGenerateAlerts } from '../../lib/intelligenceEngine'; // New import
import { addTherapistTask } from '../../lib/db'; // To pass to checkMetricsAndGenerateAlerts

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required' });
    }

    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }

    // Filter data for the specific user
    const userAppointments = allAppointments.filter(appt => appt.userId === userId);
    const userCommunicationLogs = allCommunicationLogs.filter(log => log.userId === userId);
    // Note: allClients is not filtered here but passed entirely to intelligenceEngine if needed by other functions

    try {
      const metrics = {
        attendanceRate: calculateAttendanceRate(userId, userAppointments),
        totalRevenueGenerated: calculateTotalRevenueGenerated(userId, userAppointments),
        adminTimeSavedHours: calculateAdminTimeSaved(userId, userCommunicationLogs),
      };

      // After calculating metrics, check for alerts
      checkMetricsAndGenerateAlerts({
        userId,
        metrics,
        allAppointments: userAppointments, // Pass user-specific appointments for context
        addTherapistTask, // Pass the actual function from db.js
        // Default thresholds in checkMetricsAndGenerateAlerts will be used
      });

      res.status(200).json(metrics);
    } catch (error) {
      console.error('API /api/dashboard-metrics error:', error);
      res.status(500).json({ message: 'Error calculating dashboard metrics or generating alerts', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
