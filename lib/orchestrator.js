import { users, clients, appointments, findUserById, findClientById, updateAppointment, addCommunicationLog } from './db.js';
import fs from 'fs';
import path from 'path';
import { trackEvent } from './analytics.js';
import logger from './logger.js'; // Import the structured logger

// Load Message Templates
const templatesDir = path.join(process.cwd(), 'data', 'practiceTemplates');
let practiceTemplates = {};

try {
    practiceTemplates = {
        autonomo: JSON.parse(fs.readFileSync(path.join(templatesDir, 'autonomo.json'), 'utf-8')),
        clinica: JSON.parse(fs.readFileSync(path.join(templatesDir, 'clinica.json'), 'utf-8')),
        spa: JSON.parse(fs.readFileSync(path.join(templatesDir, 'spa.json'), 'utf-8')),
    };
    logger.info('Practice templates loaded successfully.');
} catch (error) {
    logger.error('Failed to load practice templates. Ensure JSON files are correct in data/practiceTemplates.', error);
    // Fallback to empty objects to prevent crashes if files are missing during certain test runs
    // This ensures the orchestrator can still run other parts if templates are broken/missing.
    practiceTemplates = { 
        autonomo: { routines: {} }, 
        clinica: { routines: {} }, 
        spa: { routines: {} } 
    };
}


// Utility function for message variable injection
function formatMessage(templateString, variables) {
    if (!templateString) {
        logger.warn('formatMessage called with undefined templateString.', { variables });
        return "Error: Message template is undefined.";
    }
  let message = templateString;
  for (const key in variables) {
    message = message.replace(new RegExp(`\\[${key}\\]`, 'g'), variables[key]);
  }
  return message;
}

// --- Core Automation Logic ---

// 1. Confirmation Automation
export function processConfirmations() {
  console.log("\n--- Processing Confirmations ---");
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000); // appointments between 24 and 48h from now

  appointments.forEach(appt => {
    const apptStart = new Date(appt.startDateTime);
    if (apptStart > twentyFourHoursFromNow && apptStart < fortyEightHoursFromNow && !appt.confirmed && appt.status === 'scheduled') {
      const user = findUserById(appt.userId);
      const client = findClientById(appt.clientId);

      if (user && client && user.activatedRoutines.includes('confirm_24h')) {
        const templateSet = practiceTemplates[user.practiceType] || practiceTemplates.autonomo;
        const messageTemplate = templateSet.routines.confirm_24h.defaultMessage;

        const variables = {
          'Cliente': client.name,
          'Data': apptStart.toLocaleDateString('pt-BR'),
          'Hora': apptStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          'Serviço': appt.serviceName, // Assuming serviceName is available in appointment
          'Terapeuta': user.name, // Assuming therapist name is in user object
          'Nome da Clínica': user.name, // For clinica/spa templates
          'Telefone da Clínica': user.phone || 'N/A', // Example, add phone to user if needed
          'Nome do Tratamento': appt.serviceName, // For spa
          'Nome do Spa': user.name, // For spa
        };

        const finalMessage = formatMessage(messageTemplate, variables);
        console.log(`CONFIRMATION to ${client.email} (User: ${user.id}, Appt: ${appt.id}): "${finalMessage}"`);
        updateAppointment(appt.id, { confirmed: true }); // Simulate confirmation
      }
    }
  });
}

// 2. Reminder Automation
export function processReminders() {
  console.log("\n--- Processing Reminders ---");
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000); // within the next 1-2 hours

  appointments.forEach(appt => {
    const apptStart = new Date(appt.startDateTime);
    // Check if appointment is between now and 2 hours from now (more flexible than exactly 1 hour)
    if (apptStart > now && apptStart < twoHoursFromNow && appt.status === 'scheduled') {
      const user = findUserById(appt.userId);
      const client = findClientById(appt.clientId);

      if (user && client && user.activatedRoutines.includes('reminder_1h')) {
        const templateSet = practiceTemplates[user.practiceType] || practiceTemplates.autonomo;
        const messageTemplate = templateSet.routines.reminder_1h.defaultMessage;
        
        const variables = {
          'Cliente': client.name,
          'Data': apptStart.toLocaleDateString('pt-BR'),
          'Hora': apptStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          'Serviço': appt.serviceName,
          'Terapeuta': user.name,
          'Nome da Clínica': user.name,
          'Nome do Spa': user.name,
        };

        const finalMessage = formatMessage(messageTemplate, variables);
        console.log(`REMINDER to ${client.email} (User: ${user.id}, Appt: ${appt.id}): "${finalMessage}"`);
        // No specific status update for reminder, unless we add 'reminder_sent_at'
      }
    }
  });
}

// 3. Follow-up Automation
export function processFollowUps() {
  console.log("\n--- Processing Follow-ups ---");
  const now = new Date();
  const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);
  const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000); // between 23 and 25 hours ago

  appointments.forEach(appt => {
    const apptEnd = new Date(appt.endDateTime); // Follow-up based on end time
    if (apptEnd > twentyFiveHoursAgo && apptEnd < twentyThreeHoursAgo && appt.status === 'completed') {
      const user = findUserById(appt.userId);
      const client = findClientById(appt.clientId);

      if (user && client && user.activatedRoutines.includes('follow_up_24h')) {
        const templateSet = practiceTemplates[user.practiceType] || practiceTemplates.autonomo;
        const messageTemplate = templateSet.routines.follow_up_24h.defaultMessage;

        const variables = {
          'Cliente': client.name,
          'Data': new Date(appt.startDateTime).toLocaleDateString('pt-BR'), // Date of original appointment
          'Serviço': appt.serviceName,
          'Terapeuta': user.name,
          'Nome da Clínica': user.name,
          'Link da Pesquisa': 'http://example.com/feedback?appt=' + appt.id, // Placeholder
          'Nome do Spa': user.name,
          'Link para Feedback ou Novas Ofertas': 'http://example.com/spa-offers?client=' + client.id, // Placeholder
        };

        const finalMessage = formatMessage(messageTemplate, variables);
        console.log(`FOLLOW-UP to ${client.email} (User: ${user.id}, Appt: ${appt.id}): "${finalMessage}"`);
        updateAppointment(appt.id, { followUpSent: true }); // Simulate follow-up sent
      }
    }
  });
}


// Main Orchestrator Function
export function runAutomations() {
  console.log("--- Starting Automation Cycle ---");
  console.log("Current Time:", new Date().toISOString());

  // In a real scenario, you might fetch users from DB here
  // For now, we use the in-memory users array.
  
  // Process for all users - in a real app, this might be more targeted
  // or users might have individual cron jobs based on their timezone/preferences.
  processConfirmations();
  processReminders();
  processFollowUps();

  console.log("--- Automation Cycle Finished ---");
}

// If running this file directly (e.g., node lib/orchestrator.js)
if (process.argv[1] === path.join(process.cwd(),'lib','orchestrator.js')) {
  runAutomations();
}
