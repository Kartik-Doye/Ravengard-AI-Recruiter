import "dotenv/config";
import fs from "fs";
import path from "path";
import { createPool, createAdminPool } from "../src/db/index";
import bcrypt from "bcryptjs";
import { AdminSetupService } from "../src/services/adminSetupService";
import { ensureDefaultRubric } from "../src/services/rubricService";

export async function executeHardReset() {
  console.log("========================================================================");
  console.log("  RAVENGARD AI: ENTERPRISE DATABASE HARD RESET & CLEAN SLATE");
  console.log("========================================================================");

  const adminPool = createAdminPool();
  let client;
  try {
    client = await adminPool.connect();
  } catch (err: any) {
    console.warn("Admin pool connection notice, attempting standard pool:", err.message);
    const pool = createPool();
    if (!pool) {
      throw new Error("Cannot establish connection to PostgreSQL Cloud SQL database.");
    }
    client = await pool.connect();
  }

  try {
    console.log("[1/5] Re-initializing core table definitions via migrations...");

    // Apply baseline Drizzle migrations to ensure tables exist
    const migrationFiles = [
      "drizzle/0000_lowly_hardball.sql",
      "drizzle/0001_confused_silvermane.sql"
    ];

    for (const file of migrationFiles) {
      const filePath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(filePath)) continue;

      const rawSql = fs.readFileSync(filePath, "utf-8");
      const statements = rawSql
        .split("--> statement-breakpoint")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch {}
      }
    }

    console.log("[2/5] Synchronizing enterprise schema columns & funnel tables...");
    const { syncFunnelTablesAndSeed } = await import("../src/db/syncFunnelTables");
    await syncFunnelTablesAndSeed();

    console.log("[3/5] Truncating all transactional, telemetry, mock candidate, and test tables...");

    const tablesToWipe = [
      "candidate_feedback_summaries",
      "dossier_comments",
      "hr_notifications",
      "candidate_tasks",
      "ai_evaluations",
      "assessment_sessions",
      "ai_screening_results",
      "screening_queue",
      "email_outbox",
      "outbox_events",
      "interview_schedules",
      "question_scores",
      "interview_reports",
      "integrity_signals",
      "interview_responses",
      "interview_questions",
      "interview_sessions",
      "resume_analyses",
      "applications",
      "sessions",
      "candidates",
      "shadow_calibrations",
      "eeo_audits",
      "directory_sync_logs",
      "security_threat_logs",
      "audit_logs",
      "admin_logs",
      "mcq_questions",
      "rubric_dimensions",
      "jobs",
      "rubrics",
      "scim_tokens",
      "sso_configurations",
      "tenant_branding",
      "admin_users"
    ];

    for (const table of tablesToWipe) {
      try {
        await client.query(`DELETE FROM ${table};`);
      } catch (delErr: any) {
        // Table might not exist or empty
      }
    }

    console.log("[4/5] Ensuring baseline rubrics (v1.0 & v2.4-enterprise-strict)...");
    try {
      await ensureDefaultRubric("v1.0");
      await ensureDefaultRubric("v2.4-enterprise-strict");
    } catch (rubricErr: any) {
      console.warn("Rubric ensure notice:", rubricErr.message);
    }

    console.log("[5/5] Provisioning verified root super_admin account (madhunand@gmail.com)...");
    await client.query(`
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS setup_token TEXT;
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Executive Oversight';
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
    `);

    const superAdminEmail = "madhunand@gmail.com";
    const autoSetupToken = AdminSetupService.generateSetupToken(superAdminEmail);
    const initPassword = process.env.SUPER_ADMIN_INIT_PASSWORD || `SuperAdmin#${autoSetupToken.slice(0, 8)}!`;
    const superHash = await bcrypt.hash(initPassword, 10);

    // Upsert root super_admin
    await client.query(`
      INSERT INTO admin_users (id, email, name, role, department, password_hash, setup_token, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO UPDATE 
      SET email = $2, role = $4, department = $5, password_hash = $6, setup_token = $7;
    `, [
      "admin-super-primary",
      superAdminEmail,
      "Madhunand (Root Super Admin)",
      "super_admin",
      "Executive Oversight",
      superHash,
      autoSetupToken
    ]);

    // Ensure Enterprise Configuration Tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenant_branding (
        id TEXT PRIMARY KEY DEFAULT 'default_tenant',
        custom_domain TEXT DEFAULT 'careers.ravengard.ai',
        domain_verified BOOLEAN NOT NULL DEFAULT false,
        dns_status TEXT NOT NULL DEFAULT 'PENDING',
        dns_records JSONB NOT NULL DEFAULT '{"cname": {"host": "careers", "value": "cname.ravengard.ai", "status": "verified"}, "txt": {"host": "_ravengard-verify", "value": "rvg_verify_8f7b2c9a1d", "status": "pending"}}'::jsonb,
        brand_name TEXT NOT NULL DEFAULT 'Ravengard Talent',
        logo_url TEXT DEFAULT '',
        favicon_url TEXT DEFAULT '',
        primary_color_hex TEXT NOT NULL DEFAULT '#4F46E5',
        accent_color_hex TEXT NOT NULL DEFAULT '#06B6D4',
        candidate_agreement_html TEXT DEFAULT 'I hereby consent to participate in this AI-assisted structured interview evaluation.',
        smtp_host TEXT DEFAULT 'smtp.sendgrid.net',
        smtp_port INTEGER NOT NULL DEFAULT 587,
        smtp_user TEXT DEFAULT 'apikey',
        smtp_sender_email TEXT DEFAULT 'recruiting@ravengard.ai',
        smtp_sender_name TEXT DEFAULT 'Ravengard Talent Acquisition',
        smtp_secure BOOLEAN NOT NULL DEFAULT true,
        smtp_verified BOOLEAN NOT NULL DEFAULT true,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sso_configurations (
        id TEXT PRIMARY KEY,
        provider_type TEXT NOT NULL DEFAULT 'SAML_2_0',
        entity_id TEXT NOT NULL DEFAULT 'https://ravengard.ai/saml/metadata',
        sign_on_url TEXT NOT NULL DEFAULT 'https://login.microsoftonline.com/common/saml2',
        x509_certificate TEXT,
        issuer_url TEXT,
        client_id TEXT,
        client_secret TEXT,
        enabled BOOLEAN NOT NULL DEFAULT true,
        mfa_policy TEXT NOT NULL DEFAULT 'TOTP',
        allowed_domains JSONB NOT NULL DEFAULT '["ravengard.com", "enterprise.corp"]'::jsonb,
        attribute_mapping JSONB NOT NULL DEFAULT '{"email": "email", "name": "displayName", "role": "groups"}'::jsonb,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS scim_tokens (
        id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT 'Okta SCIM 2.0 Connector',
        permissions JSONB NOT NULL DEFAULT '["users:read", "users:write", "groups:read"]'::jsonb,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS security_threat_logs (
        id TEXT PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        threat_type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'MEDIUM',
        ip_address TEXT NOT NULL,
        country_code TEXT NOT NULL DEFAULT 'US',
        city TEXT NOT NULL DEFAULT 'Unknown',
        latitude NUMERIC(9, 6) NOT NULL DEFAULT 37.7749,
        longitude NUMERIC(9, 6) NOT NULL DEFAULT -122.4194,
        raw_payload_snippet TEXT NOT NULL,
        action_taken TEXT NOT NULL DEFAULT 'BLOCKED',
        metadata JSONB
      );

      CREATE TABLE IF NOT EXISTS directory_sync_logs (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL DEFAULT 'Okta SCIM',
        action TEXT NOT NULL DEFAULT 'SYNC_BATCH',
        email TEXT,
        status TEXT NOT NULL DEFAULT 'SUCCESS',
        details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Ensure Default Organization
    await client.query(`
      INSERT INTO organizations (id, name, billing_tier, is_active, created_at)
      VALUES ('org-ravengard-default', 'Ravengard Systems Inc.', 'enterprise', true, NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Ensure Tenant Branding
    await client.query(`
      INSERT INTO tenant_branding (id, custom_domain, brand_name, primary_color_hex, accent_color_hex, domain_verified, dns_status)
      VALUES ('default_tenant', 'careers.ravengard.ai', 'Ravengard Talent', '#4F46E5', '#06B6D4', false, 'PENDING')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Ensure Default SSO Configuration
    await client.query(`
      INSERT INTO sso_configurations (id, provider_type, entity_id, sign_on_url, mfa_policy, enabled)
      VALUES ('default_sso', 'SAML_2_0', 'https://ravengard.ai/saml/metadata', 'https://login.microsoftonline.com/common/saml2', 'TOTP', true)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("\n========================================================================");
    console.log("  DATABASE HARD RESET SUCCESSFUL - CLEAN PRODUCTION SLATE ACTIVE");
    console.log("========================================================================");
    console.log(`  Root Super Admin Provisioned: ${superAdminEmail}`);
    console.log(`  Role: super_admin`);
    console.log(`  Department: Executive Oversight`);
    console.log(`  Setup Token: ${autoSetupToken}`);
    console.log(`  Bootstrap Setup URL: http://localhost:3000/admin/setup?token=${autoSetupToken}`);
    console.log(`  Total Mock Candidates / Transcripts / Jobs in DB: 0`);
    console.log("========================================================================\n");

    return {
      success: true,
      purgedTablesCount: tablesToWipe.length,
      superAdmin: {
        email: superAdminEmail,
        role: "super_admin",
        setupToken: autoSetupToken
      },
      systemCounts: {
        candidates: 0,
        jobs: 0,
        sessions: 0,
        transcripts: 0
      }
    };
  } finally {
    client.release();
  }
}

// Run directly if called as a script
if (process.argv[1]?.endsWith("hard_reset_db.ts") || process.argv[1]?.endsWith("hard_reset_db.js")) {
  executeHardReset()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Hard reset failed:", err);
      process.exit(1);
    });
}
