import { AsyncLocalStorage } from "async_hooks";

export interface LogContext {
  correlationId?: string;
  organizationId?: string;
  sessionId?: string;
  candidateId?: string;
  userId?: string;
  clientIp?: string;
  [key: string]: any;
}

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

export function runWithLogContext<T>(context: LogContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

export function getLogContext(): LogContext {
  return asyncLocalStorage.getStore() || {};
}

function formatJsonLog(level: LogLevel, message: string, meta: Record<string, any> = {}): string {
  const store = getLogContext();
  const correlationId = meta.correlationId || store.correlationId || meta.requestId || store.requestId;
  const organizationId = meta.organizationId || store.organizationId;
  const sessionId = meta.sessionId || store.sessionId;
  const candidateId = meta.candidateId || store.candidateId;

  const logEntry = {
    timestamp: new Date().toISOString(),
    severity: level,
    level: level.toLowerCase(),
    message,
    service: "ravengard-platform",
    environment: process.env.NODE_ENV || "development",
    correlation_id: correlationId,
    organization_id: organizationId,
    session_id: sessionId,
    candidate_id: candidateId,
    // Standard Cloud Logging trace field
    ...(correlationId ? { "logging.googleapis.com/trace": `projects/ravengard/traces/${correlationId}` } : {}),
    ...store,
    ...meta,
  };

  return JSON.stringify(logEntry);
}

export const logger = {
  debug(message: string, meta: Record<string, any> = {}) {
    if (process.env.NODE_ENV !== "production" || process.env.LOG_LEVEL === "DEBUG") {
      console.debug(formatJsonLog("DEBUG", message, meta));
    }
  },

  info(message: string, meta: Record<string, any> = {}) {
    console.log(formatJsonLog("INFO", message, meta));
  },

  warn(message: string, meta: Record<string, any> = {}) {
    console.warn(formatJsonLog("WARN", message, meta));
  },

  error(message: string, meta: Record<string, any> = {}) {
    console.error(formatJsonLog("ERROR", message, meta));
  },

  withContext(context: LogContext) {
    return {
      debug: (msg: string, meta: Record<string, any> = {}) => logger.debug(msg, { ...context, ...meta }),
      info: (msg: string, meta: Record<string, any> = {}) => logger.info(msg, { ...context, ...meta }),
      warn: (msg: string, meta: Record<string, any> = {}) => logger.warn(msg, { ...context, ...meta }),
      error: (msg: string, meta: Record<string, any> = {}) => logger.error(msg, { ...context, ...meta }),
    };
  }
};
