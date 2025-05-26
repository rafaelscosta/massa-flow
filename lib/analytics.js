import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'engagement_events.log');

/**
 * Tracks an engagement event and logs it to a file.
 *
 * @param {string} eventName The name of the event.
 * @param {object} [properties={}] An object containing event-specific properties.
 * @param {string|null} [userId=null] The ID of the user associated with the event.
 */
export function trackEvent(eventName, properties = {}, userId = null) {
  const timestamp = new Date().toISOString();

  const eventData = {
    timestamp,
    eventName,
    userId: userId || 'anonymous_user_mvp', // Default to anonymous if no userId
    properties,
  };

  const logEntry = JSON.stringify(eventData) + '\n';

  try {
    fs.appendFileSync(LOG_FILE_PATH, logEntry, 'utf-8');
  } catch (error) {
    console.error('Failed to write to engagement_events.log:', error);
    // In a real application, you might have more robust error handling,
    // like a fallback logging mechanism or an alert system.
  }
}

// Example usage (can be removed or commented out)
// trackEvent('test_event', { detail: 'This is a test' }, 'user123');
// trackEvent('another_event', { page: 'home' });

export default trackEvent; // Export as default for easier import in API routes if preferred
