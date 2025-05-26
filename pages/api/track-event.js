import { trackEvent as logEvent } from '../../lib/analytics'; // Renamed to avoid conflict

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { eventName, properties, userId } = req.body;

    if (!eventName) {
      return res.status(400).json({ message: 'eventName is required' });
    }

    try {
      logEvent(eventName, properties, userId);
      res.status(200).json({ message: 'Event tracked successfully' });
    } catch (error) {
      console.error('API track-event error:', error);
      res.status(500).json({ message: 'Error tracking event' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
