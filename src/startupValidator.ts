import { logger } from './utils/logger';

export function validateStartupConfiguration() {
  const requiredEnvVars = [
    'NODE_ENV',
    'JWT_SECRET',
    'ACTUAL_SECRET',
    'GEMINI_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingVars.length > 0) {
    logger.error('CRITICAL: Server startup aborted. Missing required environment variables:', { missingVars });
    // In strict mode, we should throw here to prevent the server from starting insecurely
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (process.env.JWT_SECRET === 'fallback_dev_secret' || process.env.ACTUAL_SECRET === 'fallback_dev_secret') {
     logger.warn('WARNING: Using fallback development secrets in production is strictly prohibited.');
     if (process.env.NODE_ENV === 'production') {
         throw new Error('Production environment must use secure secrets.');
     }
  }

  logger.info('Startup configuration validated successfully.');
}
