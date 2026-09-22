import { logger } from './utils/logger';

export function validateStartupConfiguration() {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'ravengard_dev_jwt_secret_change_in_production';
  }
  if (!process.env.ACTUAL_SECRET) {
    process.env.ACTUAL_SECRET = process.env.JWT_SECRET;
  }
  if (!process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = 'mock_gemini_key_for_dev';
  }

  const requiredEnvVars = [
    'NODE_ENV',
    'JWT_SECRET',
    'ACTUAL_SECRET',
    'GEMINI_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingVars.length > 0) {
    logger.warn('WARNING: Missing recommended environment variables:', { missingVars });
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables in production: ${missingVars.join(', ')}`);
    }
  }

  logger.info('Startup configuration validated successfully.');
}
