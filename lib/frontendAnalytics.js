// Helper function to send events from the frontend

export async function trackFrontendEvent(eventName, properties = {}, userId = null) {
  try {
    await fetch('/api/track-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName,
        properties,
        userId: userId || 'anonymous_user_mvp', // Default for frontend events
      }),
    });
  } catch (error) {
    console.error('Failed to track frontend event:', error);
    // Silently fail for MVP, or add more robust error handling/queuing if needed
  }
}
