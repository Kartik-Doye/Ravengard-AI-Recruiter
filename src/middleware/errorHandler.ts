import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`Unhandled Error: ${message}`, err, {
    method: req.method,
    url: req.originalUrl,
    status,
    ip: req.ip,
  });

  res.status(status).json({
    success: false,
    error: status === 500 && process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message
  });
};
