import { therapistTasks, findUserById } from '../../../../lib/db'; // Adjust path as needed

export default function handler(req, res) {
  const { taskId } = req.query;
  const { userId, status: newStatus } = req.body; // Assuming userId is sent in body for validation

  if (req.method === 'PUT') {
    if (!userId) {
      return res.status(400).json({ message: 'userId is required in the request body for validation.' });
    }
    if (!newStatus) {
      return res.status(400).json({ message: 'New status is required in the request body.' });
    }
    // Basic validation for allowed statuses
    const allowedStatuses = ['new', 'read', 'archived'];
    if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({ message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(', ')}.` });
    }


    const taskIndex = therapistTasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ message: `Task with ID ${taskId} not found.` });
    }

    // Validate if the task belongs to the user making the request (important for security)
    if (therapistTasks[taskIndex].userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to update this task.' });
    }

    try {
      therapistTasks[taskIndex].status = newStatus;
      therapistTasks[taskIndex].updatedAt = new Date().toISOString(); // Add an updated timestamp

      console.log(`DB_SIM: Task ${taskId} status updated to ${newStatus} for user ${userId}.`);
      res.status(200).json(therapistTasks[taskIndex]);
    } catch (error) {
      console.error(`API /api/tasks/${taskId}/status error:`, error);
      res.status(500).json({ message: 'Error updating task status', error: error.message });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
