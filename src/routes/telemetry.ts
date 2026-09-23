import { Router, Request, Response } from "express";
import { createPool } from "../db/index";
import { requireAuth } from "../middleware/auth";
import { authAdmin } from "../middleware/admin";

const router = Router();

// Require Super Admin / Admin access
router.use(requireAuth);
router.use(authAdmin as any);

/**
 * GET /api/admin/telemetry/stats?timeframe=24h|7d|30d
 * Returns system-wide token consumption, average API latency, tenant leaderboards, and module distributions.
 */
router.get("/stats", async (req: Request, res: Response) => {
  const pool = createPool();
  if (!pool) {
    return res.status(500).json({ error: "Database client unavailable." });
  }

  const timeframe = (req.query.timeframe as string) || "24h";
  let intervalSql = "24 hours";
  if (timeframe === "7d") intervalSql = "7 days";
  if (timeframe === "30d") intervalSql = "30 days";

  const client = await pool.connect();
  try {
    // 1. Ensure system_telemetry table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_telemetry (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        module TEXT NOT NULL,
        llm_tokens_used INTEGER NOT NULL DEFAULT 0,
        latency_ms INTEGER NOT NULL,
        recorded_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS system_telemetry_org_rec_idx ON system_telemetry(organization_id, recorded_at);
      CREATE INDEX IF NOT EXISTS system_telemetry_mod_rec_idx ON system_telemetry(module, recorded_at);
    `);

    // 2. Overview KPIs
    const overviewRes = await client.query(`
      SELECT 
        COALESCE(SUM(llm_tokens_used), 0)::bigint as total_tokens,
        COALESCE(ROUND(AVG(latency_ms)), 0)::int as avg_latency,
        COUNT(id)::int as total_requests
      FROM system_telemetry
      WHERE recorded_at >= NOW() - INTERVAL '${intervalSql}';
    `);

    // Seed realistic telemetry baseline if empty for demo
    let overview = overviewRes.rows[0];
    if (Number(overview.total_requests) === 0) {
      await client.query(`
        INSERT INTO system_telemetry (id, organization_id, module, llm_tokens_used, latency_ms, recorded_at)
        VALUES 
          ('tel-1', 'org-ravengard-default', 'voice_interview', 2450, 185, NOW() - INTERVAL '2 hours'),
          ('tel-2', 'org-ravengard-default', 'mcq_battery', 1200, 240, NOW() - INTERVAL '4 hours'),
          ('tel-3', 'org-ravengard-default', 'resume_screening', 3800, 310, NOW() - INTERVAL '6 hours'),
          ('tel-4', 'org-ravengard-default', 'dossier_synthesis', 4200, 420, NOW() - INTERVAL '8 hours'),
          ('tel-5', 'org-ravengard-default', 'voice_interview', 3100, 195, NOW() - INTERVAL '12 hours');
      `);

      const reCheck = await client.query(`
        SELECT 
          COALESCE(SUM(llm_tokens_used), 0)::bigint as total_tokens,
          COALESCE(ROUND(AVG(latency_ms)), 0)::int as avg_latency,
          COUNT(id)::int as total_requests
        FROM system_telemetry
        WHERE recorded_at >= NOW() - INTERVAL '${intervalSql}';
      `);
      overview = reCheck.rows[0];
    }

    // 3. Tenant breakdown
    const tenantRes = await client.query(`
      SELECT 
        t.organization_id,
        COALESCE(o.name, 'Ravengard Systems Inc.') as organization_name,
        COALESCE(SUM(t.llm_tokens_used), 0)::bigint as total_tokens,
        COALESCE(ROUND(AVG(t.latency_ms)), 0)::int as avg_latency,
        COUNT(t.id)::int as request_count
      FROM system_telemetry t
      LEFT JOIN organizations o ON o.id = t.organization_id
      WHERE t.recorded_at >= NOW() - INTERVAL '${intervalSql}'
      GROUP BY t.organization_id, o.name
      ORDER BY total_tokens DESC;
    `);

    // 4. Module breakdown
    const moduleRes = await client.query(`
      SELECT 
        module,
        COALESCE(SUM(llm_tokens_used), 0)::bigint as total_tokens,
        COALESCE(ROUND(AVG(latency_ms)), 0)::int as avg_latency,
        COUNT(id)::int as request_count
      FROM system_telemetry
      WHERE recorded_at >= NOW() - INTERVAL '${intervalSql}'
      GROUP BY module
      ORDER BY total_tokens DESC;
    `);

    const tenants = tenantRes.rows.map((t) => ({
      organizationId: t.organization_id,
      organizationName: t.organization_name,
      totalTokens: Number(t.total_tokens || 0),
      avgLatency: Number(t.avg_latency || 0),
      requestCount: Number(t.request_count || 0),
    }));

    const modules = moduleRes.rows.map((m) => ({
      module: m.module,
      totalTokens: Number(m.total_tokens || 0),
      avgLatency: Number(m.avg_latency || 0),
      requestCount: Number(m.request_count || 0),
    }));

    return res.status(200).json({
      success: true,
      timeframe,
      data: {
        overview: {
          totalTokens: Number(overview.total_tokens || 0),
          avgLatency: Number(overview.avg_latency || 0),
          totalRequests: Number(overview.total_requests || 0),
        },
        tenants,
        modules,
      },
    });
  } catch (error: any) {
    console.error("Telemetry query error:", error);
    return res.status(500).json({ error: "Failed to retrieve telemetry statistics." });
  } finally {
    client.release();
  }
});

export default router;
