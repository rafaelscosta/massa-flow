// In-memory database simulation

// Dates for testing:
// Tomorrow at 10:00 AM
const tomorrow10AM = new Date();
tomorrow10AM.setDate(tomorrow10AM.getDate() + 1);
tomorrow10AM.setHours(10, 0, 0, 0);

// 1 hour from now
const oneHourFromNow = new Date();
oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

// 24 hours ago
const twentyFourHoursAgo = new Date();
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

// 23 hours ago (for follow-up that occurred ~24h ago)
const twentyThreeHoursAgo = new Date();
twentyThreeHoursAgo.setHours(twentyThreeHoursAgo.getHours() - 23);


export const users = [
  {
    id: 'user1',
    name: 'Maria Masso', // Added therapist name
    practiceType: 'autonomo',
    activatedRoutines: ['confirm_24h', 'reminder_1h', 'follow_up_24h'],
    tools: {
      googleCalendar: { connected: true, calendarId: 'primary' },
      // Add other tools if needed, e.g., whatsapp: { connected: true }
    },
    preferences: { // Example: User might prefer email for some, whatsapp for others
      communicationChannel: 'email' // Default channel
    },
    // Billing fields
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionTier: 'free', // 'free', 'essencial', 'profissional', 'premium'
    subscriptionStatus: 'inactive', // 'active', 'inactive', 'cancelled', 'past_due', 'incomplete'
    referralCode: null, // To be generated
    referredByUserId: null,
    successfulReferrals: [],
  },
  {
    id: 'user2',
    name: 'Clínica Bem Estar',
    practiceType: 'clinica',
    activatedRoutines: ['confirm_24h', 'reminder_1h'], // Only confirmation and reminder
    tools: {
      googleCalendar: { connected: true, calendarId: 'clinic_calendar@example.com' },
      email: { connected: true }
    },
    preferences: {
      communicationChannel: 'email'
    },
    // Billing fields
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionTier: 'free',
    subscriptionStatus: 'inactive',
    referralCode: null,
    referredByUserId: null,
    successfulReferrals: [],
  },
  {
    id: 'user3',
    name: 'Spa Oasis',
    practiceType: 'spa',
    activatedRoutines: ['confirm_24h', 'reminder_1h', 'follow_up_24h'],
    tools: {
      googleCalendar: { connected: true, calendarId: 'spa_bookings@example.com' },
    },
    preferences: {
      communicationChannel: 'email'
    },
    // Billing fields
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionTier: 'free',
    subscriptionStatus: 'inactive',
    referralCode: null,
    referredByUserId: null,
    successfulReferrals: [],
  }
];

// --- Referral Code Generation and Initialization ---
const generateReferralCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'MASSAFLOW_';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const initializeReferralCodes = () => {
  const existingCodes = new Set();
  users.forEach(user => {
    if (user.referralCode) {
      existingCodes.add(user.referralCode);
    }
  });

  users.forEach(user => {
import fs from 'fs';
import path from 'path';
import logger from './logger'; // Import the structured logger

// --- Data Directory Setup ---
const DYNAMIC_DATA_DIR = path.join(process.cwd(), 'data', 'dynamic');
if (!fs.existsSync(DYNAMIC_DATA_DIR)) {
  fs.mkdirSync(DYNAMIC_DATA_DIR, { recursive: true });
  logger.info(`Created directory for dynamic data: ${DYNAMIC_DATA_DIR}`);
}

// --- Helper function to load data from JSON file ---
const loadDataFromFile = (fileName, defaultValue = []) => {
  const filePath = path.join(DYNAMIC_DATA_DIR, fileName);
  try {
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      const parsedData = JSON.parse(fileData);
      logger.info(`Successfully loaded data from ${fileName}. Record count: ${parsedData.length}`);
      return parsedData;
    }
    logger.info(`File ${fileName} not found, initializing with default value.`, { defaultValueType: typeof defaultValue });
    return defaultValue;
  } catch (error) {
    logger.error(`Error loading data from ${fileName}. Initializing with default.`, error, { filePath });
    return defaultValue;
  }
};

// --- Helper function to save data to JSON file ---
const saveDataToFile = (fileName, data) => {
  const filePath = path.join(DYNAMIC_DATA_DIR, fileName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`Data successfully saved to ${fileName}.`);
  } catch (error) {
    logger.error(`Error saving data to ${fileName}.`, error, { filePath });
  }
};


// Dates for testing:
// Tomorrow at 10:00 AM
const tomorrow10AM = new Date();
tomorrow10AM.setDate(tomorrow10AM.getDate() + 1);
tomorrow10AM.setHours(10, 0, 0, 0);

// 1 hour from now
const oneHourFromNow = new Date();
oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

// 24 hours ago
const twentyFourHoursAgo = new Date();
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

// 23 hours ago (for follow-up that occurred ~24h ago)
const twentyThreeHoursAgo = new Date();
twentyThreeHoursAgo.setHours(twentyThreeHoursAgo.getHours() - 23);


export let users = [ // Made 'let' to allow modification by updateUserSubscriptionDetails if needed directly
  {
    id: 'user1',
    name: 'Maria Masso', // Added therapist name
    practiceType: 'autonomo',
    activatedRoutines: ['confirm_24h', 'reminder_1h', 'follow_up_24h'],
    tools: {
      googleCalendar: { connected: true, calendarId: 'primary' },
      // Add other tools if needed, e.g., whatsapp: { connected: true }
    },
    preferences: { // Example: User might prefer email for some, whatsapp for others
      communicationChannel: 'email' // Default channel
    },
    // Billing fields
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionTier: 'free', // 'free', 'essencial', 'profissional', 'premium'
    subscriptionStatus: 'inactive', // 'active', 'inactive', 'cancelled', 'past_due', 'incomplete'
    referralCode: null, // To be generated
    referredByUserId: null,
    successfulReferrals: [],
  },
  {
    id: 'user2',
    name: 'Clínica Bem Estar',
    practiceType: 'clinica',
    activatedRoutines: ['confirm_24h', 'reminder_1h'], // Only confirmation and reminder
    tools: {
      googleCalendar: { connected: true, calendarId: 'clinic_calendar@example.com' },
      email: { connected: true }
    },
    preferences: {
      communicationChannel: 'email'
    },
    // Billing fields
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionTier: 'free',
    subscriptionStatus: 'inactive',
    referralCode: null,
    referredByUserId: null,
    successfulReferrals: [],
  },
  {
    id: 'user3',
    name: 'Spa Oasis',
    practiceType: 'spa',
    activatedRoutines: ['confirm_24h', 'reminder_1h', 'follow_up_24h'],
    tools: {
      googleCalendar: { connected: true, calendarId: 'spa_bookings@example.com' },
    },
    preferences: {
      communicationChannel: 'email'
    },
    // Billing fields
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionTier: 'free',
    subscriptionStatus: 'inactive',
    referralCode: null,
    referredByUserId: null,
    successfulReferrals: [],
  }
];

// --- Referral Code Generation and Initialization ---
const generateReferralCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'MASSAFLOW_';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const initializeReferralCodes = () => {
  const existingCodes = new Set();
  users.forEach(user => {
    if (user.referralCode) {
      existingCodes.add(user.referralCode);
    }
  });

  users.forEach(user => {
    if (!user.referralCode) {
      let newCode;
      do {
        newCode = generateReferralCode();
      } while (existingCodes.has(newCode));
      user.referralCode = newCode;
      existingCodes.add(newCode);
      logger.info('Generated referral code for user.', { userId: user.id, referralCode: newCode, context: 'db_init' });
    }
    // Ensure other referral fields are initialized if not present
    if (!user.successfulReferrals) {
        user.successfulReferrals = [];
    }
    if (typeof user.referredByUserId === 'undefined') {
        user.referredByUserId = null;
    }
  });
};

initializeReferralCodes(); // Call on DB load to ensure all users have codes and fields

export const clients = [
  { id: 'client1', userId: 'user1', name: 'João Silva', email: 'joao.silva@example.com', phone: '5511999998888' },
  { id: 'client2', userId: 'user1', name: 'Ana Pereira', email: 'ana.pereira@example.com', phone: '5511999997777' },
  { id: 'client3', userId: 'user2', name: 'Carlos Souza', email: 'carlos.souza@example.com', phone: '5521988887777' },
  { id: 'client4', userId: 'user3', name: 'Sofia Loren', email: 'sofia.loren@example.com', phone: '5531977776666'},
];

export const appointments = [
  // For user1 (Autônomo)
  { // Needs confirmation (tomorrow)
    id: 'appt1',
    userId: 'user1',
    clientId: 'client1',
    serviceName: 'Massagem Relaxante', // Added service name
    startDateTime: tomorrow10AM.toISOString(),
    endDateTime: new Date(tomorrow10AM.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
    confirmed: false,
    status: 'scheduled' // e.g., scheduled, completed, cancelled
  },
  { // Needs reminder (1 hour from now)
    id: 'appt2',
    userId: 'user1',
    clientId: 'client2',
    serviceName: 'Terapia das Pedras Quentes',
    startDateTime: oneHourFromNow.toISOString(),
    endDateTime: new Date(oneHourFromNow.getTime() + 90 * 60 * 1000).toISOString(), // 1.5 hours later
    confirmed: true, // Assuming it was confirmed by automation or manually
    status: 'scheduled', // Will become 'attended' or 'no_show' later for past appts
    baseRevenue: 120,
  },
  { // Past appointment - Attended
    id: 'appt3',
    userId: 'user1',
    clientId: 'client1',
    serviceName: 'Massagem Desportiva',
    startDateTime: twentyThreeHoursAgo.toISOString(), // This was ~23h ago, so it's completed
    endDateTime: new Date(twentyThreeHoursAgo.getTime() + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'attended', 
    baseRevenue: 150,
  },
  { // Past appointment - No Show
    id: 'appt8_user1_noshow',
    userId: 'user1',
    clientId: 'client2',
    serviceName: 'Sessão de Relaxamento',
    startDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    endDateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: true, // Was confirmed
    status: 'no_show',
    baseRevenue: 90,
  },
  { // Past appointment - Attended
    id: 'appt9_user1_attended',
    userId: 'user1',
    clientId: 'client1',
    serviceName: 'Terapia Manual',
    startDateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    endDateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'attended',
    baseRevenue: 110,
  },
  { // Past appointment - Attended by another client of user1
    id: 'appt10_user1_attended_client2',
    userId: 'user1',
    clientId: 'client2',
    serviceName: 'Consulta de Avaliação',
    startDateTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    endDateTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'attended',
    baseRevenue: 70,
  },
  { // Future appointment for user1 - will be confirmed by automation
    id: 'appt11_user1_future_confirmed',
    userId: 'user1',
    clientId: 'client1',
    serviceName: 'Acupuntura',
    startDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    endDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: false, 
    status: 'scheduled', // Will be 'confirmed_by_automation' after orchestrator runs
    baseRevenue: 130,
  },
  // --- More appointments for user1 for intelligence engine testing ---
  // Client1: Mix of attended and a few cancellations
  {
    id: 'appt12_user1_client1_attended_past_60d',
    userId: 'user1',
    clientId: 'client1',
    serviceName: 'Massagem Terapêutica',
    startDateTime: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    endDateTime: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'attended',
    baseRevenue: 140,
  },
  {
    id: 'appt13_user1_client1_cancelled_past_45d',
    userId: 'user1',
    clientId: 'client1',
    serviceName: 'Reflexologia',
    startDateTime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
    endDateTime: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'cancelled_by_client',
    baseRevenue: 100,
  },
    {
    id: 'appt14_user1_client1_attended_past_15d', // Recent, good for health score
    userId: 'user1',
    clientId: 'client1',
    serviceName: 'Massagem Relaxante',
    startDateTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    endDateTime: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'attended',
    baseRevenue: 120,
  },

  // Client2: Higher cancellation rate
  {
    id: 'appt15_user1_client2_cancelled_past_70d',
    userId: 'user1',
    clientId: 'client2',
    serviceName: 'Massagem Modeladora',
    startDateTime: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(), // 70 days ago
    endDateTime: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'cancelled_by_client',
    baseRevenue: 130,
  },
  {
    id: 'appt16_user1_client2_attended_past_50d',
    userId: 'user1',
    clientId: 'client2',
    serviceName: 'Drenagem Linfática',
    startDateTime: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), // 50 days ago
    endDateTime: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'attended',
    baseRevenue: 160,
  },
  {
    id: 'appt17_user1_client2_cancelled_past_20d', // Recent cancellation
    userId: 'user1',
    clientId: 'client2',
    serviceName: 'Massagem Desportiva',
    startDateTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    endDateTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'cancelled_by_client',
    baseRevenue: 150,
  },
   { // Add one more attended for client2 to not fall into high risk by default 30% threshold (2 cancelled / 1 attended = 66%) -> (2 cancelled / 2 attended = 50%)
    id: 'appt18_user1_client2_attended_past_10d',
    userId: 'user1',
    clientId: 'client2',
    serviceName: 'Liberação Miofascial',
    startDateTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    endDateTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'attended',
    baseRevenue: 170,
  },
  // Add a new client for user1 for more variety
  { id: 'client5_user1', userId: 'user1', name: 'Lucas Martins', email: 'lucas.martins@example.com', phone: '5511966665555' },
  { // Client 5 - few appointments, one no_show
    id: 'appt19_user1_client5_attended_past_80d',
    userId: 'user1',
    clientId: 'client5_user1', // Ensure this client is added to `clients` array
    serviceName: 'Quick Massage',
    startDateTime: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(), // 80 days ago
    endDateTime: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'attended',
    baseRevenue: 60,
  },
  {
    id: 'appt20_user1_client5_noshow_past_25d', // Recent no-show, impacts health score
    userId: 'user1',
    clientId: 'client5_user1',
    serviceName: 'Massagem Relaxante',
    startDateTime: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    endDateTime: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'no_show',
    baseRevenue: 120,
  },


  // For user2 (Clínica) - No follow-up activated
   { // Needs confirmation
    id: 'appt4',
    userId: 'user2',
    clientId: 'client3',
    serviceName: 'Limpeza de Pele',
    startDateTime: tomorrow10AM.toISOString(),
    endDateTime: new Date(tomorrow10AM.getTime() + 75 * 60 * 1000).toISOString(),
    confirmed: false,
    status: 'scheduled',
    baseRevenue: 200,
  },
  { // Needs reminder
    id: 'appt5',
    userId: 'user2',
    clientId: 'client3',
    serviceName: 'Drenagem Linfática',
    startDateTime: oneHourFromNow.toISOString(),
    endDateTime: new Date(oneHourFromNow.getTime() + 50 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'scheduled',
    baseRevenue: 180,
  },
   // For user3 (Spa)
  { // Needs confirmation (tomorrow)
    id: 'appt6',
    userId: 'user3',
    clientId: 'client4',
    serviceName: 'Day Spa Completo',
    startDateTime: tomorrow10AM.toISOString(),
    endDateTime: new Date(tomorrow10AM.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
    confirmed: false,
    status: 'scheduled',
    baseRevenue: 500,
  },
  { // Needs follow-up (occurred ~24 hours ago)
    id: 'appt7',
    userId: 'user3',
    clientId: 'client4',
    serviceName: 'Massagem Sueca',
    startDateTime: twentyFourHoursAgo.toISOString(), // Exactly 24h ago for this one
    endDateTime: new Date(twentyFourHoursAgo.getTime() + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'attended', // Changed from 'completed' to 'attended' for metric calculation
    baseRevenue: 250,
  }
];

// Function to update appointment status (simulated)
export const updateAppointment = (appointmentId, updates) => {
  const index = appointments.findIndex(appt => appt.id === appointmentId);
  if (index !== -1) {
    appointments[index] = { ...appointments[index], ...updates };
    console.log(`DB_SIM: Appointment ${appointmentId} updated with ${JSON.stringify(updates)}`);
    return appointments[index];
  }
  console.log(`DB_SIM: Appointment ${appointmentId} not found for update.`);
  return null;
};

// Function to find user by ID
export const findUserById = (userId) => users.find(u => u.id === userId);

// Function to find client by ID
export const findClientById = (clientId) => clients.find(c => c.id === clientId);

// --- Communication Logs ---
export let communicationLogs = [];

/**
 * Adds a new communication log.
 * @param {object} logEntry - The communication log entry.
 * @returns {object} The added log entry.
 */
export const addCommunicationLog = (logEntry) => {
  // Simulate generating a simple ID for the log
  const newLog = { id: `comm_${Date.now()}_${communicationLogs.length + 1}`, ...logEntry };
  communicationLogs.push(newLog);
  console.log(`DB_SIM: Communication log added for userId: ${newLog.userId}, clientId: ${newLog.clientId}, type: ${newLog.type}`);
  return newLog;
};

/**
 * Retrieves communication logs based on userId and optionally clientId.
 * @param {string} userId - The ID of the user.
 * @param {string} [clientId] - Optional ID of the client.
 * @returns {Array} An array of communication logs.
 */
export const getCommunicationLogs = (userId, clientId = null) => {
  let logs = communicationLogs.filter(log => log.userId === userId);
  if (clientId) {
    logs = logs.filter(log => log.clientId === clientId);
  }
  // Sort by timestamp descending (newest first)
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

// --- Therapist Tasks ---
export let therapistTasks = [];

/**
 * Adds a new task for a therapist.
 * @param {object} taskEntry - The task entry.
 * @returns {object} The added task entry.
 */
export const addTherapistTask = (taskEntry) => {
  therapistTasks.push(taskEntry);
  console.log(`DB_SIM: Therapist task added for userId: ${taskEntry.userId}, type: ${taskEntry.type}, appointmentId: ${taskEntry.appointmentId}`);
  return taskEntry;
};

/**
 * Retrieves tasks for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Array} An array of tasks for the user, sorted by creation date descending.
 */
export const getTherapistTasks = (userId) => {
  return therapistTasks
    .filter(task => task.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// --- Support Tickets ---
export let supportTickets = [];

/**
 * Adds a new support ticket.
 * @param {object} ticketData - The ticket data.
 * @returns {object} The added ticket.
 */
export const addSupportTicket = (ticketData) => {
  const newTicket = { 
    id: `ticket_${Date.now()}_${supportTickets.length + 1}`,
    replies: [], // Initialize with empty replies
    ...ticketData 
  };
  supportTickets.push(newTicket);
  console.log(`DB_SIM: Support ticket ${newTicket.id} added for userId: ${newTicket.userId}.`);
  return newTicket;
};

/**
 * Retrieves all support tickets for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Array} An array of support tickets for the user, sorted by creation date descending.
 */
export const getSupportTicketsByUserId = (userId) => {
  return supportTickets
    .filter(ticket => ticket.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Retrieves a specific support ticket by its ID.
 * @param {string} ticketId - The ID of the ticket.
 * @returns {object|undefined} The ticket object or undefined if not found.
 */
export const getSupportTicketById = (ticketId) => {
  return supportTickets.find(ticket => ticket.id === ticketId);
};
