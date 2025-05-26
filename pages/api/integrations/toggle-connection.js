import { 
  users, 
  findUserById, 
  addTherapistTask,
  // Assume we have a way to update user's tool connection status in db.js
  // For MVP, this might be directly manipulating users[].tools or a dedicated function
} from '../../../lib/db'; 
import { trackEvent } from '../../../lib/analytics';

// Helper to update tool status in the 'users' array (simulated DB)
// In a real DB, this would be an update query.
const updateUserToolStatus = (userId, toolId, newStatus) => {
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    if (!users[userIndex].tools) {
      users[userIndex].tools = {};
    }
    if (!users[userIndex].tools[toolId]) {
      users[userIndex].tools[toolId] = {};
    }
    users[userIndex].tools[toolId].connected = newStatus === 'connected';
    console.log(`DB_SIM: User ${userId} tool ${toolId} connection status updated to ${newStatus}`);
    return true;
  }
  return false;
};


export default function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, toolId, toolName, desiredStatus } = req.body;

    if (!userId || !toolId || !toolName || !desiredStatus) {
      return res.status(400).json({ message: 'userId, toolId, toolName, and desiredStatus are required' });
    }

    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: `User with ID ${userId} not found.` });
    }

    // Simulate connection failure for 'email' tool when trying to connect
    if (toolId === 'email' && desiredStatus === 'connected') {
      // Simulate failure
      addTherapistTask({
        id: `task_tool_${Date.now()}`,
        userId,
        type: 'tool_connection_failed',
        message: `Falha ao tentar conectar a ferramenta '${toolName}'. Por favor, verifique as configurações e tente novamente ou contate o suporte.`,
        status: 'new',
        relatedEntityId: toolId, // Store which tool failed
        createdAt: new Date().toISOString(),
      });

      updateUserToolStatus(userId, toolId, 'disconnected'); // Ensure it remains disconnected

      trackEvent('tool_connection_update_failed', {
        userId,
        tool_name: toolName,
        attempted_status: desiredStatus,
      });
      
      // Return a specific error or a modified success indicating the task was created
      return res.status(422).json({ // 422 Unprocessable Entity or a custom error status
        message: `Falha simulada ao conectar ${toolName}. Uma tarefa foi criada.`,
        status: 'disconnected', // Reflecting the actual status
        task_created: true 
      });
    }

    // For other tools or disconnecting 'email', simulate success
    const success = updateUserToolStatus(userId, toolId, desiredStatus);

    if (success) {
      trackEvent('tool_connection_updated', { // Existing event
        userId,
        tool_name: toolName,
        status: desiredStatus, // 'connected' or 'disconnected'
        context: 'integrations_page_api' // Indicate context
      });
      res.status(200).json({ message: `Status de ${toolName} atualizado para ${desiredStatus}.`, status: desiredStatus });
    } else {
      // This case should ideally not happen if user validation is correct.
      res.status(500).json({ message: `Erro ao atualizar status de ${toolName}.`});
    }

  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
