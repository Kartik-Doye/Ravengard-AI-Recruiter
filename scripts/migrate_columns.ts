import "dotenv/config";
import { createPool } from "../src/db/index";

async function migrate() {
  const pool = createPool();
  if (!pool) {
    console.error("No database pool available.");
    process.exit(1);
  }

  try {
    console.log("Applying database column migrations...");
    await pool.query(`
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS setup_token TEXT;
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
      ALTER TABLE candidates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

      CREATE TABLE IF NOT EXISTS anti_cheat_profiles (
        id TEXT PRIMARY KEY,
        session_id TEXT REFERENCES sessions(id),
        application_id TEXT REFERENCES applications(id),
        delta_ttft_avg_ms INTEGER DEFAULT 450,
        delta_ttft_max_ms INTEGER DEFAULT 600,
        secondary_device_risk_score INTEGER DEFAULT 0,
        prosody_score INTEGER DEFAULT 92,
        rapid_probe_count INTEGER DEFAULT 0,
        rapid_probe_passed INTEGER DEFAULT 0,
        cross_modal_divergence_count INTEGER DEFAULT 0,
        risk_flags JSONB,
        telemetry_log JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Database schema migrations applied successfully!");
    process.exit(0);
  } catch (err: any) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
