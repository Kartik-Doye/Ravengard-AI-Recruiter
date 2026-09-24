import type { Request, Response, NextFunction } from "express";
import { createPool } from "../db/index";
import crypto from "crypto";

export const SOFT_QUOTA_TOKENS = 100_000;
export const HARD_QUOTA_TOKENS = 500_000;

interface RequestWithOrg extends Request {
  user?: { organizationId?: string | null };
  principal?: { organizationId?: string | null };
  candidate?: { organizationId?: string | null };
  admin?: { organizationId?: string | null };
}

/**
 * Middleware to enforce tenant-level AI token usage limits.
 * - Soft warning: >= 100,000 tokens adds warning headers
 * - Hard block: >= 500,000 tokens returns 429 Too Many Requests
 */
export async function requireTenantQuota(
  req: RequestWithOrg,
  res: Response,
  next: NextFunction
) {
  try {
    const orgId =
      req.user?.organizationId ||
      req.principal?.organizationId ||
      req.candidate?.organizationId ||
      req.admin?.organizationId ||
      (req.headers["x-organization-id"] as string) ||
      (req.query.organizationId as string) ||
      "org-ravengard-default";

    const pool = createPool();
    if (!pool) {
      // If DB is unavailable, fail open to avoid breaking user flows
      return next();
    }

    const client = await pool.connect();
    try {
      // Ensure table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS system_telemetry (
          id TEXT PRIMARY KEY,
          organization_id TEXT NOT NULL,
          module TEXT NOT NULL,
          llm_tokens_used INTEGER NOT NULL DEFAULT 0,
          latency_ms INTEGER NOT NULL,
          recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);

      const queryRes = await client.query(
        `
        SELECT COALESCE(SUM(llm_tokens_used), 0)::bigint as total_tokens
        FROM system_telemetry
        WHERE organization_id = $1
          AND recorded_at >= NOW() - INTERVAL '30 days';
        `,
        [orgId]
      );

      const totalTokens = Number(queryRes.rows[0]?.total_tokens || 0);

      // Set informative headers
      res.setHeader("X-Tenant-Tokens-Used", String(totalTokens));
      res.setHeader("X-Tenant-Tokens-Limit", String(HARD_QUOTA_TOKENS));

      // Check Hard Quota (500,000 tokens)
      if (totalTokens >= HARD_QUOTA_TOKENS) {
        return res.status(429).json({
          error: "Monthly tenant token quota exceeded (500,000 tokens limit). Contact enterprise admin to increase limits.",
          code: "TENANT_QUOTA_EXCEEDED",
          tokensUsed: totalTokens,
          quotaLimit: HARD_QUOTA_TOKENS,
        });
      }

      // Check Soft Quota (100,000 tokens)
      if (totalTokens >= SOFT_QUOTA_TOKENS) {
        res.setHeader(
          "X-Tenant-Quota-Warning",
          `Soft quota limit of ${SOFT_QUOTA_TOKENS.toLocaleString()} tokens exceeded (Current: ${totalTokens.toLocaleString()}).`
        );
      }

      return next();
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error evaluating tenant quota:", err);
    // Graceful fail-open on telemetry calculation error
    return next();
  }
}

/**
 * Helper to record LLM token telemetry into database
 */
export async function recordTelemetryUsage(
  organizationId: string = "org-ravengard-default",
  module: string = "voice_interview",
  tokensUsed: number = 0,
  latencyMs: number = 0
): Promise<void> {
  try {
    const pool = createPool();
    if (!pool) return;

    const client = await pool.connect();
    try {
      await client.query(
        `
        INSERT INTO system_telemetry (id, organization_id, module, llm_tokens_used, latency_ms, recorded_at)
        VALUES ($1, $2, $3, $4, $5, NOW());
        `,
        [`tel-${crypto.randomUUID()}`, organizationId, module, tokensUsed, latencyMs]
      );
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Failed to record telemetry usage:", err);
  }
}
