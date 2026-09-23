import { createPool } from "../db/index";

export async function processAssessmentTimeouts(): Promise<{ timedOutCount: number }> {
  const pool = createPool();
  if (!pool) return { timedOutCount: 0 };
  
  let client;
  try {
    client = await pool.connect();
  } catch (connErr: any) {
    // Database connecting or not ready yet
    return { timedOutCount: 0 };
  }

  try {
    // 1. Verify applications table exists first
    const tableCheck = await client.query(`
      SELECT to_regclass('public.applications') as tbl;
    `);
    
    if (!tableCheck.rows[0]?.tbl) {
      // Table not yet created, return safely
      return { timedOutCount: 0 };
    }

    // 2. Fetch existing column names on public.applications
    const colsRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'applications';
    `);
    const existingCols = new Set(colsRes.rows.map((r: any) => r.column_name.toLowerCase()));

    // 3. Add missing columns if they don't exist yet
    if (!existingCols.has("assessment_expires_at")) {
      try {
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS assessment_expires_at TIMESTAMP WITH TIME ZONE;`);
        existingCols.add("assessment_expires_at");
      } catch {
        // Fall through
      }
    }

    if (!existingCols.has("sla_expires_at")) {
      try {
        await client.query(`ALTER TABLE applications ADD COLUMN IF NOT EXISTS sla_expires_at TIMESTAMP WITH TIME ZONE;`);
        existingCols.add("sla_expires_at");
      } catch {
        // Fall through
      }
    }

    // 4. Construct adaptive query based on confirmed available columns
    const hasAssessmentExpires = existingCols.has("assessment_expires_at");
    const hasSlaExpires = existingCols.has("sla_expires_at");

    let timeoutCondition = `created_at < NOW() - INTERVAL '24 hours'`;
    if (hasAssessmentExpires && hasSlaExpires) {
      timeoutCondition = `(
        (assessment_expires_at IS NOT NULL AND assessment_expires_at < NOW()) OR
        (sla_expires_at IS NOT NULL AND sla_expires_at < NOW()) OR
        (created_at < NOW() - INTERVAL '24 hours')
      )`;
    } else if (hasAssessmentExpires) {
      timeoutCondition = `(
        (assessment_expires_at IS NOT NULL AND assessment_expires_at < NOW()) OR
        (created_at < NOW() - INTERVAL '24 hours')
      )`;
    }

    const result = await client.query(`
      UPDATE applications 
      SET status = 'rejected_timeout', updated_at = NOW() 
      WHERE status IN ('applied', 'assessment_pending', 'mcq_in_progress') 
        AND ${timeoutCondition}
      RETURNING id, candidate_id, job_id;
    `);

    if (result.rows.length > 0) {
      console.log(`[SLA Timeout Worker] Auto-rejected ${result.rows.length} applications due to 24-hour assessment SLA expiry:`, result.rows.map((r: any) => r.id));
    }

    return { timedOutCount: result.rows.length };
  } catch (err: any) {
    // Graceful error logging without spamming
    return { timedOutCount: 0 };
  } finally {
    if (client) client.release();
  }
}
