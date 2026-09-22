import "dotenv/config";
import { db, createPool } from "../src/db/index";
import { sql } from "drizzle-orm";

async function migrateHrFunnel() {
  console.log("Starting HR Funnel and 3-Dashboard schema migration...");
  const pool = createPool();

  try {
    // 1. Ensure organizations exists and has default org
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id text PRIMARY KEY,
        name text NOT NULL,
        created_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      INSERT INTO organizations (id, name)
      VALUES ('org-ravengard', 'Ravengard Systems')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Update admin_users columns
    try {
      await pool.query(`
        ALTER TABLE admin_users 
        ADD COLUMN IF NOT EXISTS organization_id text REFERENCES organizations(id);
      `);
    } catch (e: any) {
      console.warn("Notice: ALTER TABLE admin_users skipped/already configured:", e.message);
    }

    try {
      await pool.query(`
        ALTER TABLE admin_logs 
        ADD COLUMN IF NOT EXISTS organization_id text REFERENCES organizations(id);
      `);
    } catch (e: any) {
      console.warn("Notice: ALTER TABLE admin_logs skipped/already configured:", e.message);
    }

    // 3. Create jobs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id text PRIMARY KEY,
        organization_id text NOT NULL REFERENCES organizations(id),
        title text NOT NULL,
        department text,
        description text NOT NULL,
        requirements_json jsonb,
        screening_threshold integer NOT NULL DEFAULT 70,
        require_human_rejection_approval boolean NOT NULL DEFAULT true,
        status text NOT NULL DEFAULT 'active',
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS jobs_id_org_unique_idx ON jobs (id, organization_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS jobs_org_created_idx ON jobs (organization_id, created_at);
    `);

    // 4. Create applications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id text PRIMARY KEY,
        job_id text NOT NULL REFERENCES jobs(id),
        candidate_id text NOT NULL REFERENCES candidates(id),
        organization_id text NOT NULL REFERENCES organizations(id),
        status text NOT NULL DEFAULT 'applied',
        session_id text REFERENCES sessions(id),
        magic_token_hash text,
        magic_token_expires_at timestamp,
        magic_token_used_at timestamp,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS applications_candidate_job_unique_idx ON applications (candidate_id, job_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS applications_org_status_idx ON applications (organization_id, status);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS applications_magic_token_hash_idx ON applications (magic_token_hash);
    `);

    // 5. Create ai_screening_results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_screening_results (
        id text PRIMARY KEY,
        application_id text NOT NULL REFERENCES applications(id),
        match_score integer NOT NULL,
        strengths_summary jsonb,
        gaps_summary jsonb,
        full_rationale_json jsonb,
        screening_version text NOT NULL DEFAULT 'v1.0',
        created_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ai_screening_app_version_idx ON ai_screening_results (application_id, screening_version);
    `);

    // 6. Create screening_queue table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS screening_queue (
        id text PRIMARY KEY,
        application_id text NOT NULL REFERENCES applications(id),
        organization_id text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        attempts integer NOT NULL DEFAULT 0,
        last_error text,
        locked_at timestamp,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS screening_queue_status_idx ON screening_queue (status);
    `);

    // 7. Create email_outbox table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_outbox (
        id text PRIMARY KEY,
        recipient_email text NOT NULL,
        recipient_name text,
        template_type text NOT NULL,
        subject text NOT NULL,
        body_text text NOT NULL,
        body_html text,
        application_id text REFERENCES applications(id),
        organization_id text,
        idempotency_key text UNIQUE,
        status text NOT NULL DEFAULT 'pending',
        attempts integer NOT NULL DEFAULT 0,
        last_error text,
        sent_at timestamp,
        created_at timestamp DEFAULT now()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS email_outbox_status_idx ON email_outbox (status);
    `);

    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    throw err;
  }
}

migrateHrFunnel()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
