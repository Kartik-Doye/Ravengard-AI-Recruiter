/**
 * Simple JSON logger for the application.
 * In development: logs to console with colors and formatting via console methods.
 * In production: outputs valid JSON lines suitable for log aggregation systems.
 *
 * All methods accept an optional meta object for additional context.
 */
export const logger = {
  info: (message: string, meta?: any) => {
    const logEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    if (process.env.NODE_ENV === 'production') {
      // Production: output JSON only
      console.log(JSON.stringify(logEntry));
    } else {
      // Development: pretty-print with color via console.info
      console.log(JSON.stringify(logEntry, null, 2));
    }
  },

  warn: (message: string, meta?: any) => {
    const logEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.warn(JSON.stringify(logEntry, null, 2));
    }
  },

  error: (message: string, error?: any, meta?: any) => {
    const errorDetails = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        }
      : error;

    const logEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: errorDetails,
      ...meta,
    };

    if (process.env.NODE_ENV === 'production') {
      console.error(JSON.stringify(logEntry));
    } else {
      console.error(JSON.stringify(logEntry, null, 2));
    }
  },

  debug: (message: string, meta?: any) => {
    // Only log debug in non-production environments
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const logEntry = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    console.debug(JSON.stringify(logEntry, null, 2));
  }
};