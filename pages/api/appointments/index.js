import { 
  appointments, 
  addCommunicationLog, // Keep if used by other parts, not directly used here
  clients, 
  findClientById, 
  findUserById, 
  users,
  therapistTasks, // Import if you plan to directly manipulate it, otherwise use addTherapistTask
  addTherapistTask // Import the helper function
} from '../../../lib/db'; // Adjust path as needed
import { identifyHighCancellationRiskClients } from '../../../lib/intelligenceEngine'; // Adjust path
import { trackEvent } from '../../../lib/analytics'; // Adjust path

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, clientId, startDateTime, endDateTime, baseRevenue, serviceName } = req.body;

    if (!userId || !clientId || !startDateTime || !endDateTime || typeof baseRevenue !== 'number' || !serviceName) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId, clientId, startDateTime, endDateTime, serviceName, and baseRevenue (must be a number).' 
      });
    }

    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }

    const client = findClientById(clientId);
    if (!client || client.userId !== userId) {
      return res.status(404).json({ message: `Client with ID ${clientId} not found for user ${userId}.` });
    }

    try {
      const newAppointment = {
        id: `appt_${Date.now()}_${appointments.length + 1}`,
        userId,
        clientId,
        startDateTime,
        endDateTime,
        serviceName, // Added serviceName
        baseRevenue,
        confirmed: false, // Default for new appointments
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };

      appointments.push(newAppointment); // Add to in-memory DB
      console.log(`DB_SIM: Appointment ${newAppointment.id} created for user ${userId}, client ${clientId}.`);

      // After saving, check for high-risk client
      const riskyClientList = identifyHighCancellationRiskClients({
        userId,
        allAppointments: appointments, // Use the updated list
        allClients: clients,
        // Default cancellationThreshold and minAppointments will be used from the engine
      });

      const isRisky = riskyClientList.find(risky => risky.clientId === clientId);

      if (isRisky) {
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

        trackEvent('intelligent_automation_alert_generated', {
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
        console.log(`INTELLIGENCE: High-risk client ${clientId} booked. Task created and event tracked.`);
      }

      res.status(201).json(newAppointment);
    } catch (error) {
      console.error('API /api/appointments POST error:', error);
      res.status(500).json({ message: 'Error creating appointment', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
