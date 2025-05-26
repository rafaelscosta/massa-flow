import { getCommunicationLogs, findUserById } from '../../../lib/db'; // Adjust path as needed

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { userId, clientId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required' });
    }
    
    // For MVP, we'll require clientId for simplicity, as per instructions.
    // "Para o MVP, pode-se simplificar para exigir userId e clientId sempre"
    if (!clientId) {
        return res.status(400).json({ message: 'clientId query parameter is required for MVP' });
    }

    // Validate if user exists (optional but good practice)
    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }

    try {
      // In a real DB, this query would be more efficient.
      // For our in-memory simulation, getCommunicationLogs handles filtering.
      const logs = getCommunicationLogs(userId, clientId); 
      
      if (!logs || logs.length === 0) {
        return res.status(200).json([]); // Return empty array if no logs found, not 404
      }

      res.status(200).json(logs);
    } catch (error) {
      console.error('API /api/communications error:', error);
      res.status(500).json({ message: 'Error fetching communication logs' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
