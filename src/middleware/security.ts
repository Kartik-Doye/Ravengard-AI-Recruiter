import helmet from 'helmet';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

// Parse the comma-separated allowlist once at startup.
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Setup CORS configuration based on environment.
// In production we never fall back to the wildcard: credentialed requests with
// `Access-Control-Allow-Origin: *` are rejected by browsers, so an unset
// CORS_ORIGIN in production should deny cross-origin access rather than silently
// asking for an invalid combination.
const corsOptions: cors.CorsOptions = {
  origin: configuredOrigins.length > 0 ? configuredOrigins : !isProduction,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id', 'x-request-id'],
  exposedHeaders: ['X-Request-Id', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

const connectSrc = [
  "'self'",
  'ws:',
  'wss:',
  ...(process.env.APP_URL ? [process.env.APP_URL.trim()] : []),
  ...(process.env.CSP_CONNECT_SRC
    ? process.env.CSP_CONNECT_SRC.split(',').map((s) => s.trim()).filter(Boolean)
    : []),
];

export const securityMiddleware = [
  // Security headers. CSP is disabled in development so the Vite dev server and
  // HMR client (which rely on eval and inline scripts) keep working.
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          useDefaults: false,
          directives: {
            defaultSrc: ["'self'"],
            // Vite's production bundle is emitted as external scripts; inline is
            // retained only for the theme/analytics bootstrapping snippets.
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            connectSrc,
            workerSrc: ["'self'", 'blob:'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", 'blob:'],
            frameSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false, // Would block the cross-origin Google Fonts above
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: isProduction
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  }),

  // CORS configuration
  cors(corsOptions),

  // Request ID injection for correlation
  (req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  },
];
