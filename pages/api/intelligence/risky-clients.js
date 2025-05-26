import { appointments as allAppointments, clients as allClients, findUserById } from '../../../lib/db'; // Adjust path
import { identifyHighCancellationRiskClients } from '../../../lib/intelligenceEngine'; // Adjust path

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { userId, cancellationThreshold, minAppointments } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required' });
    }

    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }

    try {
      const params = {
        userId,
        allAppointments,
        allClients,
      };
      if (cancellationThreshold) params.cancellationThreshold = parseFloat(cancellationThreshold);
      if (minAppointments) params.minAppointments = parseInt(minAppointments, 10);
      
      const riskyClients = identifyHighCancellationRiskClients(params);
      
      res.status(200).json(riskyClients);
    } catch (error) {
      console.error('API /api/intelligence/risky-clients error:', error);
      res.status(500).json({ message: 'Error identifying risky clients', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
