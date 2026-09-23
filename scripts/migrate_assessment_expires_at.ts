import "dotenv/config";
import { Pool } from "pg";

export async function runAssessmentExpiresAtMigration() {
  const adminUser = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
  const adminPassword = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: adminUser,
    password: adminPassword,
    database: process.env.SQL_DB_NAME,
    port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
    ssl: process.env.DB_REQUIRE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  try {
    console.log(`[Migration] Running assessment_expires_at migration as user: ${adminUser}...`);

    await client.query(`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS assessment_expires_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS sla_expires_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS mcq_score INTEGER,
      ADD COLUMN IF NOT EXISTS interview_score INTEGER,
      ADD COLUMN IF NOT EXISTS offer_details_json JSONB;
    `);

    // Ensure permissions are granted to the app user
    if (process.env.SQL_USER && process.env.SQL_USER !== adminUser) {
      await client.query(`
        GRANT ALL PRIVILEGES ON TABLE applications TO ${process.env.SQL_USER};
      `);
      console.log(`[Migration] Granted full table permissions on applications to ${process.env.SQL_USER}`);
    }

    console.log("[Migration] Successfully added 'assessment_expires_at' and associated columns to applications table.");
  } catch (err: any) {
    console.error("[Migration] Error applying assessment_expires_at migration:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1]?.includes("migrate_assessment_expires_at")) {
  runAssessmentExpiresAtMigration().then(() => process.exit(0));
}
