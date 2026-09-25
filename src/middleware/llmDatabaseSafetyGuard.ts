import { Request, Response, NextFunction } from "express";
import { recordAuditEvent } from "../services/enterpriseAuditService";
import { logger } from "../utils/logger";

/**
 * Enterprise Zero-Delete & LLM Database Safety Interceptor
 * 
 * Enforces strict non-destructive database policies:
 * 1. AI agents, LLM tool executions, and automated background workers can NEVER execute raw DELETE, DROP, TRUNCATE, or ALTER SQL statements.
 * 2. All entity removals must pass through application-level Soft Deletes (deleted_at timestamp) or explicit Super Admin purge controls.
 * 3. Any violation is immediately intercepted, rejected with 403 Forbidden, and recorded in the immutable audit log.
 */
export function llmDatabaseSafetyGuard(req: Request, res: Response, next: NextFunction) {
  const body = req.body || {};
  const query = req.query || {};

  // Inspect raw SQL payload parameters if present in request body or query (e.g. tool execution payloads)
  const candidateSql = (typeof body.sql === "string" ? body.sql : "") ||
                       (typeof body.query === "string" ? body.query : "") ||
                       (typeof query.sql === "string" ? String(query.sql) : "");

  if (candidateSql) {
    const normalized = candidateSql.trim().toUpperCase();
    const forbiddenPatterns = [
      /\bDELETE\s+FROM\b/i,
      /\bDROP\s+TABLE\b/i,
      /\bDROP\s+DATABASE\b/i,
      /\bTRUNCATE\b/i,
      /\bALTER\s+TABLE\b/i
    ];

    const isDestructive = forbiddenPatterns.some(pattern => pattern.test(normalized));

    if (isDestructive) {
      logger.warn(`[SECURITY ALERT] Destructive SQL execution intercepted and blocked: ${candidateSql.slice(0, 100)}`);
      
      // Async audit record
      const orgId = (req as any).hr?.organizationId || (req as any).user?.organizationId || "org-ravengard";
      const userEmail = (req as any).hr?.email || (req as any).user?.email || "ai-agent-boundary";
      const userRole = (req as any).hr?.role || (req as any).user?.role || "llm_agent";

      recordAuditEvent({
        organizationId: orgId,
        userId: (req as any).hr?.id || (req as any).user?.id || "llm-runtime",
        userEmail,
        userName: "Autonomous AI Agent Guardrail",
        userRole,
        action: "LLM_DELETE_BLOCKED",
        resourceType: "database_security_boundary",
        resourceId: "zero_delete_enforcer",
        details: {
          blockedSql: candidateSql.slice(0, 200),
          reason: "Zero-Delete Policy: AI agents are strictly forbidden from executing direct destructive SQL operations.",
          timestamp: new Date().toISOString()
        },
        ipAddress: req.ip
      }).catch(err => console.error("Audit log error on blocked SQL:", err));

      return res.status(403).json({
        success: false,
        error: "Forbidden: Zero-Delete Policy Violation. AI agents and automated queries cannot execute destructive SQL statements (DELETE / DROP / TRUNCATE). Soft deletion must be used.",
        code: "LLM_ZERO_DELETE_GUARD_TRIGGERED"
      });
    }
  }

  next();
}

/**
 * Validates that an SQL query string contains no destructive statements before execution
 */
export function assertSafeQuery(sqlString: string): void {
  const forbiddenPatterns = [
    /\bDELETE\s+FROM\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bDROP\s+DATABASE\b/i,
    /\bTRUNCATE\b/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(sqlString)) {
      throw new Error(`[LLM_ZERO_DELETE_GUARD] Query rejected: Direct destructive SQL execution is forbidden. Query: ${sqlString.slice(0, 80)}...`);
    }
  }
}
