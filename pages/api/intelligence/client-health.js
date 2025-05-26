import { appointments as allAppointments, clients as allClients, findUserById } from '../../../lib/db'; // Adjust path
import { calculateClientHealthScore } from '../../../lib/intelligenceEngine'; // Adjust path

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { userId, clientId } = req.query;

    if (!userId || !clientId) {
      return res.status(400).json({ message: 'userId and clientId query parameters are required' });
    }

    // Optional: Validate if user exists (can be removed if not strictly needed for this endpoint's logic)
    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }
    
    // Client existence is implicitly checked within calculateClientHealthScore based on clientId and userId

    try {
      const healthScoreData = calculateClientHealthScore({
        userId,
        clientId,
        allAppointments,
        allClients,
      });

      if (!healthScoreData) {
        // This case is handled if calculateClientHealthScore returns null for a client not found for the user
        return res.status(404).json({ message: `Client with ID ${clientId} not found for user ${userId}, or no data available.` });
      }
      
      res.status(200).json(healthScoreData);
    } catch (error) {
      console.error('API /api/intelligence/client-health error:', error);
      res.status(500).json({ message: 'Error calculating client health score', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
