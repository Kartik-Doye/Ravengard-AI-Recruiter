/**
 * Database Security Guard & LLM Query Guardrails
 * Enforces strict database safety preventing LLM/AI layers and unprivileged processes
 * from executing destructive queries (DELETE, DROP, TRUNCATE, ALTER, GRANT, REVOKE, etc.)
 */

export class DatabaseSecurityGuard {
  private static readonly BLOCKED_PATTERNS = [
    /\bDELETE\s+FROM\b/i,
    /\bDROP\s+(TABLE|DATABASE|SCHEMA|VIEW|INDEX|TRIGGER|FUNCTION)\b/i,
    /\bTRUNCATE\s+(TABLE)?\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bGRANT\s+.+\s+TO\b/i,
    /\bREVOKE\s+.+\s+FROM\b/i,
    /\bEXEC(UTE)?\s+sp_\b/i,
    /;\s*--/i,
  ];

  /**
   * Validate that an incoming SQL statement or AI-generated database instruction is non-destructive
   * Throws an error if any destructive pattern is identified.
   */
  public static validateSafeQuery(sqlString: string, callerContext: string = "AI_QUERY_ENGINE"): void {
    if (!sqlString || typeof sqlString !== "string") {
      throw new Error(`[DB_SECURITY_VIOLATION] Invalid query string provided by ${callerContext}`);
    }

    const trimmed = sqlString.trim();

    // Check for blocked destructive commands
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(trimmed)) {
        console.error(`[DB_SECURITY_BLOCK] Blocked potentially destructive query by ${callerContext}: ${trimmed}`);
        throw new Error(
          `[SECURITY_ERROR] Destructive operation blocked. The AI / LLM layer is strictly prohibited from executing DELETE, DROP, TRUNCATE, or schema alteration queries.`
        );
      }
    }
  }

  /**
   * Safe execution wrapper: checks query before executing on the database pool
   */
  public static sanitizeAndAssertReadOnly(sqlString: string): boolean {
    const isSelect = /^\s*SELECT\b/i.test(sqlString.trim());
    if (!isSelect) {
      throw new Error("[SECURITY_ERROR] Only read-only SELECT queries are permitted in this context.");
    }
    this.validateSafeQuery(sqlString);
    return true;
  }
}
