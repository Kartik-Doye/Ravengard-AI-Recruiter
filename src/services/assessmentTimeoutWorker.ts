import { createPool } from "../db/index";

export async function processAssessmentTimeouts(): Promise<{ timedOutCount: number }> {
  const pool = createPool();
  if (!pool) return { timedOutCount: 0 };
  const client = await pool.connect();

  try {
    // 24-Hour Strict Auto-Reject TTL query
    const result = await client.query(`
      UPDATE applications 
      SET status = 'rejected_timeout', updated_at = NOW() 
      WHERE status IN ('applied', 'assessment_pending', 'mcq_in_progress') 
      AND (
        (assessment_expires_at IS NOT NULL AND assessment_expires_at < NOW()) OR
        (sla_expires_at IS NOT NULL AND sla_expires_at < NOW()) OR
        (created_at < NOW() - INTERVAL '24 hours' AND status IN ('applied', 'assessment_pending', 'mcq_in_progress'))
      )
      RETURNING id, candidate_id, job_id;
    `);

    if (result.rows.length > 0) {
      console.log(`[SLA Timeout Worker] Auto-rejected ${result.rows.length} applications due to 24-hour assessment SLA expiry:`, result.rows.map(r => r.id));
    }

    return { timedOutCount: result.rows.length };
  } catch (err: any) {
    console.error("[SLA Timeout Worker] Error processing timeouts:", err.message);
    return { timedOutCount: 0 };
  } finally {
    client.release();
  }
}
