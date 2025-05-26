/**
 * Calculates the attendance rate for a given user.
 * @param {string} userId - The ID of the user. (Currently not used in calculation as appointments are pre-filtered)
 * @param {Array} appointments - List of appointments for the user.
 * @returns {number} Attendance rate (0 to 1), or 0 if no relevant appointments.
 */
export function calculateAttendanceRate(userId, appointments) {
  if (!appointments || appointments.length === 0) {
    return 0;
  }

  const attendedAppointments = appointments.filter(appt => appt.status === 'attended').length;
  const noShowAppointments = appointments.filter(appt => appt.status === 'no_show').length;

  const totalRelevantAppointments = attendedAppointments + noShowAppointments;

  if (totalRelevantAppointments === 0) {
    return 0; // Avoid division by zero if no attended or no_show appointments
  }

  return attendedAppointments / totalRelevantAppointments;
}

/**
 * Calculates the total revenue generated from attended appointments.
 * @param {string} userId - The ID of the user. (Currently not used in calculation)
 * @param {Array} appointments - List of appointments for the user.
 * @returns {number} Total revenue generated.
 */
export function calculateTotalRevenueGenerated(userId, appointments) {
  if (!appointments || appointments.length === 0) {
    return 0;
  }

  return appointments.reduce((total, appt) => {
    if (appt.status === 'attended' && typeof appt.baseRevenue === 'number') {
      return total + appt.baseRevenue;
    }
    return total;
  }, 0);
}

/**
 * Calculates the estimated administrative time saved through automations.
 * @param {string} userId - The ID of the user. (Currently not used in calculation)
 * @param {Array} communicationLogs - List of communication logs for the user.
 * @returns {number} Estimated admin time saved in hours.
 */
export function calculateAdminTimeSaved(userId, communicationLogs) {
  if (!communicationLogs || communicationLogs.length === 0) {
    return 0;
  }

  const MINUTES_SAVED_PER_AUTOMATION = 5; // Fixed value for MVP
  const successfulAutomations = communicationLogs.filter(log => log.status === 'success').length;

  return (successfulAutomations * MINUTES_SAVED_PER_AUTOMATION) / 60;
}
