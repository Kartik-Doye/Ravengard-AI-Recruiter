import "dotenv/config";
import { createPool } from "../src/db/index";

async function migrateFinOpsAndStudio() {
  const pool = createPool();
  if (!pool) {
    console.error("No database pool available.");
    process.exit(1);
  }

  try {
    console.log("Applying FinOps & AI Persona Studio database migrations...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS department_budgets (
        id TEXT PRIMARY KEY,
        department TEXT NOT NULL UNIQUE,
        monthly_token_cap INTEGER NOT NULL DEFAULT 500000,
        soft_warning_threshold INTEGER NOT NULL DEFAULT 80,
        hard_cap_action TEXT NOT NULL DEFAULT 'DEGRADE_MODEL',
        current_month_usage_tokens INTEGER NOT NULL DEFAULT 0,
        estimated_cost_usd NUMERIC(10, 4) DEFAULT 0.0000,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS token_ledger (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        department TEXT NOT NULL,
        model_used TEXT NOT NULL,
        prompt_tokens INTEGER NOT NULL,
        completion_tokens INTEGER NOT NULL,
        stt_seconds NUMERIC(8, 2) DEFAULT 0.00,
        tts_characters INTEGER DEFAULT 0,
        total_cost_usd NUMERIC(10, 6) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_token_ledger_dept ON token_ledger(department, created_at);
      CREATE INDEX IF NOT EXISTS idx_token_ledger_session ON token_ledger(session_id);

      CREATE TABLE IF NOT EXISTS model_routing_rules (
        id TEXT PRIMARY KEY,
        seniority_level TEXT NOT NULL UNIQUE,
        primary_model TEXT NOT NULL,
        fallback_model TEXT NOT NULL,
        max_prompt_tokens_override INTEGER DEFAULT 4096,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS persona_configs (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL DEFAULT 'default_org',
        persona_name TEXT NOT NULL DEFAULT 'Sarah',
        strictness_level INTEGER NOT NULL DEFAULT 3,
        interruption_policy TEXT NOT NULL DEFAULT 'ADAPTIVE',
        cadence_wpm INTEGER NOT NULL DEFAULT 165,
        probing_sensitivity INTEGER NOT NULL DEFAULT 4,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rubric_templates (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        title TEXT NOT NULL,
        dimensions JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        created_by TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_rubric_templates_job ON rubric_templates(job_id, status);

      CREATE TABLE IF NOT EXISTS prompt_versions (
        id TEXT PRIMARY KEY,
        rubric_template_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        system_prompt TEXT NOT NULL,
        diff_summary TEXT,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_prompt_versions_rubric ON prompt_versions(rubric_template_id, version);
    `);

    // Seed default departments if not present
    const defaultDepts = [
      { id: "dept_engineering", dept: "Engineering", cap: 1500000, current: 840250, cost: "14.2850" },
      { id: "dept_product", dept: "Product", cap: 600000, current: 412000, cost: "6.9800" },
      { id: "dept_design", dept: "Design", cap: 400000, current: 185000, cost: "3.1450" },
      { id: "dept_sales", dept: "Sales", cap: 500000, current: 490000, cost: "8.3300" },
      { id: "dept_operations", dept: "Operations", cap: 300000, current: 95000, cost: "1.6150" }
    ];

    for (const d of defaultDepts) {
      await pool.query(`
        INSERT INTO department_budgets (id, department, monthly_token_cap, soft_warning_threshold, hard_cap_action, current_month_usage_tokens, estimated_cost_usd)
        VALUES ($1, $2, $3, 80, 'DEGRADE_MODEL', $4, $5)
        ON CONFLICT (department) DO NOTHING;
      `, [d.id, d.dept, d.cap, d.current, d.cost]);
    }

    // Seed default routing rules
    const defaultRoutings = [
      { id: "route_staff", level: "STAFF", primary: "gemini-3.1-pro-preview", fallback: "gemini-3.8-flash" },
      { id: "route_senior", level: "SENIOR", primary: "gemini-3.8-flash", fallback: "gemini-3.8-flash" },
      { id: "route_mid", level: "MID", primary: "gemini-3.8-flash", fallback: "gemini-3.8-flash" },
      { id: "route_junior", level: "JUNIOR", primary: "gemini-3.8-flash", fallback: "gemini-3.8-flash" },
      { id: "route_intern", level: "INTERN", primary: "gemini-3.8-flash", fallback: "gemini-3.8-flash" },
    ];

    for (const r of defaultRoutings) {
      await pool.query(`
        INSERT INTO model_routing_rules (id, seniority_level, primary_model, fallback_model, max_prompt_tokens_override)
        VALUES ($1, $2, $3, $4, 4096)
        ON CONFLICT (seniority_level) DO NOTHING;
      `, [r.id, r.level, r.primary, r.fallback]);
    }

    // Seed default persona config
    await pool.query(`
      INSERT INTO persona_configs (id, organization_id, persona_name, strictness_level, interruption_policy, cadence_wpm, probing_sensitivity)
      VALUES ('persona_default', 'default_org', 'Sarah', 4, 'ADAPTIVE', 165, 4)
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("✅ FinOps and Persona Studio database tables and default datasets seeded successfully!");
    process.exit(0);
  } catch (err: any) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrateFinOpsAndStudio();
