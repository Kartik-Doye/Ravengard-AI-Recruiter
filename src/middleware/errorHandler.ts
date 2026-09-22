import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Central error handling middleware.
 * - Logs the error with request context for debugging.
 * - Responds with a JSON error object.
 * - In production, does not leak stack traces or internal error messages unless they are from known safe categories (e.g., validation errors).
 * - Includes a request ID if available for tracing.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Extract request ID from headers (set by security middleware) or generate one for logging
  const requestId = req.headers['x-request-id'] as string | undefined;

  // Determine status code: use err.status if defined, otherwise 500
  const status = err.status || 500;

  // Determine if this is a known client error (4xx) that we can safely show the message for
  const isClientError = status >= 400 && status < 500;

  // In production, hide internal error messages for 500 errors to avoid leaking stack traces or sensitive info
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  // Log the error with full details (including stack trace) for internal debugging
  logger.error(`Unhandled Error: ${message}`, err, {
    method: req.method,
    url: req.originalUrl,
    status,
    ip: req.ip,
    requestId,
    // Only include stack in logs if not production? We'll include always in logs for debugging.
    // In production, logs might be stored securely; we assume logs are safe.
  });

  // Prepare response body
  const responseBody: any = {
    success: false,
    error: message,
  };

  // Include request ID in response headers for client-side correlation (optional)
  if (requestId) {
    res.setHeader('X-Request-Id', requestId);
  }

  // Optionally, include error code or extra info for client errors (e.g., validation errors)
  if (isClientError && err.code) {
    responseBody.code = err.code;
  }
  if (isClientError && err.details) {
    // Be careful not to leak sensitive info in details
    responseBody.details = err.details;
  }

  res.status(status).json(responseBody);
};