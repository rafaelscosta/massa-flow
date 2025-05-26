const log = (level, message, context = {}, errorObj = null) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (Object.keys(context).length > 0) {
    logEntry.context = context;
  }

  if (errorObj && errorObj instanceof Error) {
    logEntry.error = {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
    };
    // If the error object has additional properties (like 'details' from a custom error), include them.
    const additionalErrorProps = { ...errorObj };
    delete additionalErrorProps.message; // Already captured
    delete additionalErrorProps.stack;   // Already captured
    delete additionalErrorProps.name;    // Already captured
    if (Object.keys(additionalErrorProps).length > 0) {
        logEntry.error.details = additionalErrorProps;
    }
  }

  // Use console[level.toLowerCase()] if it exists, otherwise console.log
  const consoleMethod = console[level.toLowerCase()] || console.log;
  consoleMethod(JSON.stringify(logEntry, null, 2)); // Pretty print for readability in console
};

export const logger = {
  info: (message, context = {}) => {
    log('INFO', message, context);
  },
  warn: (message, context = {}) => {
    log('WARN', message, context);
  },
  error: (message, errorObj = null, context = {}) => {
    // Ensure errorObj is the second argument for consistency if no specific context is passed initially
    if (errorObj && !(errorObj instanceof Error) && Object.keys(context).length === 0) {
        // If errorObj is not an Error, and context is empty, assume errorObj is context
        log('ERROR', message, errorObj);
    } else {
        log('ERROR', message, context, errorObj);
    }
  },
};

export default logger;
