/**
 * Migration: Create system_telemetry table if it doesn't exist.
 * This table is required by LLMRouter.recordTelemetry() and the tenant quota middleware.
 */
import "dotenv/config";
import { createPool } from "../src/db/index";

async function main() {
  const pool = createPool();
  if (!pool) {
    console.error("No database pool available");
    process.exit(1);
  }

  const client = await pool.connect();
  try {
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

    await client.query(`
      CREATE INDEX IF NOT EXISTS system_telemetry_org_rec_idx ON system_telemetry(organization_id, recorded_at);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS system_telemetry_mod_rec_idx ON system_telemetry(module, recorded_at);
    `);

    console.log("✅ system_telemetry table created (or already existed)");
  } catch (err: any) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
