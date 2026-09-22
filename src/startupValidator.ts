import { logger } from './utils/logger';

/**
 * Validate that the application has the minimum required configuration to start.
 * In development, we allow fallbacks for convenience but log warnings.
 * In production, we require explicit values and fail fast if missing or using insecure defaults.
 */
export function validateStartupConfiguration() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // Define required environment variables and their expected patterns (if any)
  const requiredEnvVars: Record<string, { optional?: boolean; pattern?: RegExp; insecureDefaults?: string[] }> = {
    NODE_ENV: { optional: false },
    JWT_SECRET: {
      optional: false,
      pattern: /^.+$/, // Must be set to something
      insecureDefaults: [
        'ravengard_dev_jwt_secret_change_in_production',
        'change_this_in_production',
        'your_jwt_secret_here',
        'secret'
      ]
    },
    ACTUAL_SECRET: {
      optional: false,
      pattern: /^.+$/,
      insecureDefaults: [
        'ravengard_dev_jwt_secret_change_in_production',
        'change_this_in_production',
        'your_jwt_secret_here',
        'secret'
      ]
    },
    GEMINI_API_KEY: {
      optional: false, // Required for AI features
      pattern: /^.+$/,
      insecureDefaults: [
        'mock_gemini_key_for_dev',
        'your_gemini_api_key_here',
        'test_key'
      ]
    },
    DATABASE_URL: {
      optional: false, // Required for database connection
      pattern: /^postgres(ql)?:\/\//, // Must be a postgres connection string
      insecureDefaults: [
        'postgresql://user:password@localhost:5432/dbname',
        'postgres://user:password@localhost:5432/dbname'
      ]
    },
    // Optional but recommended for production
    APP_URL: { optional: true },
    CORS_ORIGIN: { optional: true },
    HELMET_ENABLED: { optional: true },
    // Add more as needed
  };

  // Check each required variable
  const missingVars: string[] = [];
  const insecureVars: string[] = [];

  for (const [varName, options] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];

    if (options.optional && !value) {
      // Optional and not set - skip
      continue;
    }

    if (!value) {
      missingVars.push(varName);
      continue;
    }

    // Check for insecure defaults in production
    if (isProduction && options.insecureDefaults && options.insecureDefaults.includes(value)) {
      insecureVars.push(varName);
      continue;
    }

    // Check pattern if provided
    if (options.pattern && !options.pattern.test(value)) {
      // We'll treat pattern mismatch as a warning, not a failure, for now
      logger.warn(`Environment variable ${varName} does not match expected pattern.`, { varName, value });
    }
  }

  // Handle missing variables
  if (missingVars.length > 0) {
    const message = `Missing required environment variables: ${missingVars.join(', ')}`;
    if (isProduction) {
      logger.error(message);
      throw new Error(message);
    } else {
      logger.warn(message);
    }
  }

  // Handle insecure defaults in production
  if (insecureVars.length > 0) {
    const message = `Insecure default values detected for environment variables in production: ${insecureVars.join(', ')}. Please set these to secure values.`;
    logger.error(message);
    throw new Error(message);
  }

  // Additional production-specific checks
  if (isProduction) {
    // Ensure NODE_ENV is explicitly set to production (not just not development)
    if (process.env.NODE_ENV !== 'production') {
      logger.error('NODE_ENV must be set to "production" in production environment.');
      throw new Error('NODE_ENV must be set to "production" in production environment.');
    }

    // Log a warning if CORS_ORIGIN is not set (might be intentional but worth noting)
    if (!process.env.CORS_ORIGIN) {
      logger.warn('CORS_ORIGIN is not set in production. This may restrict legitimate cross-origin requests.');
    }

    // Ensure HELMET_ENABLED is true (should be by default, but check)
    if (process.env.HELMET_ENABLED === 'false') {
      logger.warn('HELMET_ENABLED is set to false in production. This disables important security headers.');
    }
  }

  logger.info('Startup configuration validated successfully.', { nodeEnv });
}