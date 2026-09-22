import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Only log API routes and skip static assets/Vite hot-reloading source requests
  if (!req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/health')) {
    return next();
  }

  const start = Date.now();
  const requestId = req.headers['x-request-id'] || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`HTTP ${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
      requestId,
    });
  });

  next();
};

