import { 
  appointments, 
  addCommunicationLog, // Keep if used by other parts, not directly used here
  clients, 
  findClientById, 
  findUserById, 
  users,
  therapistTasks, // Import if you plan to directly manipulate it, otherwise use addTherapistTask
  addTherapistTask
} from '../../../lib/db';
import { identifyHighCancellationRiskClients } from '../../../lib/intelligenceEngine';
import { trackEvent } from '../../../lib/analytics';
import logger from '../../../lib/logger';

export default function handler(req, res) {
  const { method } = req;
  const route = req.url;

  if (method === 'POST') {
    const { userId, clientId, startDateTime, endDateTime, baseRevenue, serviceName } = req.body;
    const requestBody = { userId, clientId, startDateTime, endDateTime, baseRevenue, serviceName };

    if (!userId || !clientId || !startDateTime || !endDateTime || typeof baseRevenue !== 'number' || !serviceName) {
      logger.warn('Missing required fields for appointment creation.', { route, requestBody });
      return res.status(400).json({ 
        message: 'Missing required fields: userId, clientId, startDateTime, endDateTime, serviceName, and baseRevenue (must be a number).' 
      });
    }

    const user = findUserById(userId);
    if (!user) {
      logger.warn('User not found during appointment creation.', { route, userId });
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }

    const client = findClientById(clientId);
    if (!client || client.userId !== userId) {
      logger.warn('Client not found or does not belong to user during appointment creation.', { route, userId, clientId });
      return res.status(404).json({ message: `Client with ID ${clientId} not found for user ${userId}.` });
    }
    
    logger.info('Attempting to create appointment.', { route, requestBody });

    try {
      const newAppointment = {
        id: `appt_${Date.now()}_${appointments.length + 1}`,
        userId,
        clientId,
        startDateTime,
        endDateTime,
        serviceName,
        baseRevenue,
        confirmed: false,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };

      appointments.push(newAppointment);
      logger.info(`Appointment created successfully in DB_SIM.`, { route, appointmentId: newAppointment.id, userId, clientId });

      // After saving, check for high-risk client
      const riskyClientList = identifyHighCancellationRiskClients({
        userId,
        allAppointments: appointments,
        allClients: clients,
      });

      const isRisky = riskyClientList.find(risky => risky.clientId === clientId);

      if (isRisky) {
        logger.info('High-risk client detected for new appointment.', { route, userId, clientId, appointmentId: newAppointment.id, riskData: isRisky });
        const taskMessage = `Alerta: Cliente ${client.name} (ID: ${clientId}), com alto risco de no-show (taxa de cancelamento: ${isRisky.cancellationRate * 100}%), agendou para ${new Date(startDateTime).toLocaleString('pt-BR')}. Considere ação preventiva.`;
        
        addTherapistTask({
          id: `task_${Date.now()}`,
          userId,
          appointmentId: newAppointment.id,
          clientId,
          type: 'no_show_risk_alert',
          message: taskMessage,
          status: 'new',
          createdAt: new Date().toISOString(),
        });

        trackEvent('intelligent_automation_alert_generated', { // This is an analytics event, not a structured log
          type: 'no_show_prevention_high_risk_client',
          userId,
          clientId,
          appointmentId: newAppointment.id,
          riskDetails: {
            cancellationRate: isRisky.cancellationRate,
            attendedCount: isRisky.attendedCount,
            cancelledByClientCount: isRisky.cancelledByClientCount,
          }
        });
      }

      res.status(201).json(newAppointment);
    } catch (error) {
      logger.error('Error creating appointment.', error, { route, requestBody });
      res.status(500).json({ message: 'Error creating appointment', error: error.message });
    }
  } else {
    logger.warn(`Method ${method} not allowed for ${route}.`);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
