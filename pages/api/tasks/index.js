import { getTherapistTasks, findUserById } from '../../../lib/db'; // Adjust path as needed

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

    try {
      const tasks = getTherapistTasks(userId); // This function already filters by userId and sorts
      
      // No need to check if tasks array is empty, API should return empty array if no tasks.
      res.status(200).json(tasks);
    } catch (error) {
      console.error('API /api/tasks error:', error);
      res.status(500).json({ message: 'Error fetching therapist tasks', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
