import promClient from 'prom-client';

// Create a Registry which registers the metrics
const registry = new promClient.Registry();

// Enable default metrics (like CPU, memory, event loop lag)
promClient.collectDefaultMetrics({ register: registry, prefix: 'massaflcw_node_' });

// --- Define Custom Metrics ---

// 1. HTTP Requests Total
export const httpRequestsTotal = new promClient.Counter({
  name: 'massaflcw_http_requests_total',
  help: 'Total number of HTTP requests processed by the application.',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry],
});

// 2. HTTP Request Duration Seconds
export const httpRequestDurationSeconds = new promClient.Histogram({
  name: 'massaflcw_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds.',
  labelNames: ['method', 'route'],
  buckets: [0.05, 0.1, 0.3, 0.5, 0.8, 1, 2, 5], // Buckets in seconds
  registers: [registry],
});

// 3. API Errors Total
export const apiErrorsTotal = new promClient.Counter({
  name: 'massaflcw_api_errors_total',
  help: 'Total number of API errors.',
  labelNames: ['route', 'method', 'error_type', 'status_code'], // Added method and status_code for more context
  registers: [registry],
});


// --- Middleware/Helper for Instrumentation ---
// This helper can be used in API routes to simplify instrumentation
export const observeMetrics = async (req, res, handlerFn) => {
  const route = req.url || '/unknown_route'; // Get route from req.url
  const method = req.method || 'UNKNOWN_METHOD';
  const endTimer = httpRequestDurationSeconds.startTimer({ method, route });
  
  let errorType = null;
  let statusCode = res.statusCode; // Default status code

  try {
    await handlerFn(req, res);
    // Ensure statusCode is captured *after* handlerFn has potentially set it
    statusCode = res.statusCode; 
  } catch (error) {
    // This catch block is for unhandled errors in handlerFn.
    // Most errors should be handled within handlerFn and status code set appropriately.
    statusCode = res.statusCode >= 400 ? res.statusCode : 500; // Use existing error status or default to 500
    errorType = 'unhandled_exception';
    apiErrorsTotal.inc({ route, method, error_type: errorType, status_code: statusCode });
    // Re-throw the error if you want Next.js default error handling or further up the chain.
    // For now, we assume handlerFn handles its own response sending on error.
    // If not, you'd need to res.status(statusCode).json(...) here.
    console.error("Unhandled exception caught by observeMetrics:", error); // Use console.error for this critical case
    if (!res.headersSent) {
        res.status(statusCode).json({ message: "Internal Server Error from observeMetrics" });
    }
  } finally {
    endTimer(); // Observe duration
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    // Note: apiErrorsTotal for handled errors (like validation) should be incremented *within* handlerFn
    // where the specific error_type is known.
  }
};


// Export the registry for the /api/metrics endpoint
export { registry };
export default promClient; // Export promClient itself if needed elsewhere, or just the registry
