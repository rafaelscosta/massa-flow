import { registry } from '../../lib/metrics'; // Import the prom-client registry
import logger from '../../lib/logger'; // Import the structured logger

export default async function handler(req, res) {
  const { method } = req;
  const route = req.url || '/api/metrics';

  if (method === 'GET') {
    try {
      logger.info('Serving Prometheus metrics.', { route });
      res.setHeader('Content-Type', registry.contentType);
      res.end(await registry.metrics());
    } catch (error) {
      logger.error('Error serving Prometheus metrics.', error, { route });
      res.status(500).send('Error serving metrics');
    }
  } else {
    logger.warn(`Method ${method} not allowed for ${route}.`);
    res.setHeader('Allow', ['GET']);
    res.status(405).end('Method Not Allowed');
  }
}
