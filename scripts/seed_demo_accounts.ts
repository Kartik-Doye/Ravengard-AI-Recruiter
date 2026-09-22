import "dotenv/config";
import { createPool } from "../src/db/index";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function seedDemoAccounts() {
  console.log("Seeding Ravengard demo accounts and initial jobs/applicants...");
  const pool = createPool();

  try {
    // 1. Ensure Organization exists
    await pool.query(`
      INSERT INTO organizations (id, name)
      VALUES ('org-ravengard', 'Ravengard Systems')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Ensure Super Admin user
    const defaultPassword = process.env.ADMIN_PASSWORD_HASH || "kartik@doye#26";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await pool.query(`
      INSERT INTO admin_users (id, email, name, role, organization_id, password_hash)
      VALUES 
        ('admin-super', 'superadmin@ravengard.com', 'Super Administrator', 'super_admin', 'org-ravengard', $1),
        ('admin-root', 'admin@ravengard.com', 'Ravengard Lead Auditor', 'super_admin', 'org-ravengard', $1),
        ('hr-lead', 'hr@ravengard.com', 'Sarah Jenkins (VP Talent)', 'hr_admin', 'org-ravengard', $1)
      ON CONFLICT (email) 
      DO UPDATE SET 
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        password_hash = EXCLUDED.password_hash;
    `, [passwordHash]);

    console.log("✅ Seeded Admin & HR users with password:", defaultPassword);
    console.log("   - superadmin@ravengard.com (super_admin)");
    console.log("   - admin@ravengard.com (super_admin)");
    console.log("   - hr@ravengard.com (hr_admin)");

    // 3. Seed initial jobs if none exist
    const jobCheck = await pool.query(`SELECT count(*)::int as count FROM jobs WHERE organization_id = 'org-ravengard';`);
    if (jobCheck.rows[0].count === 0) {
      const job1Id = "job-sr-dist-sys";
      const job2Id = "job-lead-fullstack";

      await pool.query(`
        INSERT INTO jobs (id, organization_id, title, department, description, requirements_json, screening_threshold, require_human_rejection_approval, status)
        VALUES 
          ($1, 'org-ravengard', 'Senior Distributed Systems Architect', 'Core Infrastructure', 
           'We are seeking an exceptional engineer to design and scale our next-generation fault-tolerant distributed consensus cluster and real-time streaming services.',
           '{"required_skills": ["distributed systems", "postgresql", "typescript", "consensus algorithms", "event streaming", "grpc"], "experience_years": 5}',
           75, true, 'active'),
          ($2, 'org-ravengard', 'Lead Full-Stack AI Engineer', 'AI Platform Engineering',
           'Lead the engineering of interactive AI candidate streaming experiences, real-time audio/visual proctoring telemetry, and high-performance server architectures.',
           '{"required_skills": ["react", "typescript", "node", "postgresql", "sse", "webrtc", "system design"], "experience_years": 4}',
           70, true, 'active');
      `, [job1Id, job2Id]);

      console.log("✅ Seeded 2 production job openings.");
    }

    console.log("✅ Database accounts and initial state are ready.");
  } catch (err: any) {
    console.error("Failed to seed demo accounts:", err);
  } finally {
    await pool.end();
  }
}

seedDemoAccounts();
