import { getTherapistTasks, findUserById } from '../../../lib/db'; // Adjust path as needed

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { userId, status } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId query parameter is required' });
    }
    if (!status) {
      return res.status(400).json({ message: 'status query parameter is required' });
    }

    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }

    try {
      const allUserTasks = getTherapistTasks(userId); // This function already filters by userId
      const count = allUserTasks.filter(task => task.status === status).length;
      
      res.status(200).json({ count });
    } catch (error) {
      console.error('API /api/tasks/count error:', error);
      res.status(500).json({ message: 'Error counting tasks', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
