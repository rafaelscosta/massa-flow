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
    }
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
    }
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
    }
  }
];

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
    confirmed: true,
    status: 'scheduled'
  },
  { // Needs follow-up (occurred ~24 hours ago)
    id: 'appt3',
    userId: 'user1',
    clientId: 'client1',
    serviceName: 'Massagem Desportiva',
    startDateTime: twentyThreeHoursAgo.toISOString(),
    endDateTime: new Date(twentyThreeHoursAgo.getTime() + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'completed'
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
    status: 'scheduled'
  },
  { // Needs reminder
    id: 'appt5',
    userId: 'user2',
    clientId: 'client3',
    serviceName: 'Drenagem Linfática',
    startDateTime: oneHourFromNow.toISOString(),
    endDateTime: new Date(oneHourFromNow.getTime() + 50 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'scheduled'
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
    status: 'scheduled'
  },
  { // Needs follow-up (occurred ~24 hours ago)
    id: 'appt7',
    userId: 'user3',
    clientId: 'client4',
    serviceName: 'Massagem Sueca',
    startDateTime: twentyFourHoursAgo.toISOString(), // Exactly 24h ago for this one
    endDateTime: new Date(twentyFourHoursAgo.getTime() + 60 * 60 * 1000).toISOString(),
    confirmed: true,
    status: 'completed'
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
