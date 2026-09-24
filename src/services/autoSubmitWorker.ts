import { db, createPool } from "../db/index";
import { hrNotifications, applications, sessions, interviewReports, aiEvaluations } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { scoringService } from "./scoringService";
import crypto from "crypto";

export interface AbandonedSessionResult {
  processedCount: number;
  sessionIds: string[];
}

/**
 * Periodically detects active interview/assessment sessions that have been abandoned
 * (no heartbeat received for > 5 minutes). Transitions them to partial_submission
 * and triggers partial scoring / dossier evaluation so candidate answers are preserved.
 */
export async function processAbandonedSessions(): Promise<AbandonedSessionResult> {
  const pool = createPool();
  if (!pool) return { processedCount: 0, sessionIds: [] };

  let client;
  try {
    client = await pool.connect();
  } catch {
    return { processedCount: 0, sessionIds: [] };
  }

  const processedIds: string[] = [];

  try {
    // Check if sessions & applications tables exist
    const tableCheck = await client.query(`SELECT to_regclass('public.sessions') as tbl;`);
    if (!tableCheck.rows[0]?.tbl) {
      return { processedCount: 0, sessionIds: [] };
    }

    // Find sessions in active interview stages that have not pinged heartbeat in > 5 minutes
    // and are not already completed or partial_submission
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const abandonedSessionsQuery = `
      SELECT s.id as session_id, s.candidate_id, s.organization_id, s.current_stage, s.status,
             c.name as candidate_name, c.email as candidate_email,
             a.id as application_id, a.job_id
      FROM sessions s
      LEFT JOIN candidates c ON s.candidate_id = c.id
      LEFT JOIN applications a ON s.id = a.session_id OR s.candidate_id = a.candidate_id
      WHERE s.status = 'active'
        AND s.current_stage IN ('interview_hr_friendly', 'interview_technical', 'interview_cto', 'waiting_room')
        AND (s.last_active_at IS NOT NULL AND s.last_active_at < $1)
      LIMIT 20;
    `;

    const res = await client.query(abandonedSessionsQuery, [fiveMinutesAgo]);
    const rows = res.rows || [];

    for (const row of rows) {
      try {
        const sessionId = row.session_id;
        const orgId = row.organization_id || "org-ravengard";
        const candidateName = row.candidate_name || "Candidate";
        const candidateId = row.candidate_id;
        const appId = row.application_id;

        // 1. Mark session as partial_submission & locked
        await client.query(
          `UPDATE sessions 
           SET status = 'partial_submission', 
               current_stage = 'report_generation',
               updated_at = NOW() 
           WHERE id = $1`,
          [sessionId]
        );

        // 2. Update application status to partial_submission if exists
        if (appId) {
          await client.query(
            `UPDATE applications 
             SET status = 'partial_submission', 
                 updated_at = NOW() 
             WHERE id = $1`,
            [appId]
          );
        }

        // 3. Trigger partial dossier / report generation
        try {
          await scoringService.generateFinalReport(sessionId);
        } catch (scoreErr) {
          console.warn(`[AutoSubmitWorker] Partial scoring note for session ${sessionId}:`, scoreErr);
        }

        // 4. Create HR notification for partial submission
        const notifId = `notif-${crypto.randomUUID()}`;
        await client.query(
          `INSERT INTO hr_notifications (id, organization_id, type, title, message, application_id, candidate_id, is_read, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
           ON CONFLICT DO NOTHING`,
          [
            notifId,
            orgId,
            "PARTIAL_SUBMISSION",
            `Auto-Submitted: ${candidateName}`,
            `Session was disconnected for >5 mins. Completed answers have been safely graded as partial submission.`,
            appId || null,
            candidateId || null,
          ]
        );

        processedIds.push(sessionId);
        console.log(`[AutoSubmitWorker] Gracefully auto-submitted abandoned session ${sessionId} for ${candidateName}`);
      } catch (itemErr) {
        console.error(`[AutoSubmitWorker] Error processing abandoned session ${row.session_id}:`, itemErr);
      }
    }

    return { processedCount: processedIds.length, sessionIds: processedIds };
  } catch (err) {
    console.error("[AutoSubmitWorker] Unexpected error checking abandoned sessions:", err);
    return { processedCount: 0, sessionIds: [] };
  } finally {
    client.release();
  }
}

// Background poller interval (runs every 60 seconds in server runtime)
let autoSubmitInterval: NodeJS.Timeout | null = null;

export function startAutoSubmitWorker(): void {
  if (autoSubmitInterval) return;
  autoSubmitInterval = setInterval(async () => {
    try {
      await processAbandonedSessions();
    } catch {}
  }, 60 * 1000);
  console.log("[AutoSubmitWorker] Graceful Auto-Submit Heartbeat Worker initialized.");
}
