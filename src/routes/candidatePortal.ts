import { Router, Response } from "express";
import { db } from "../db/index";
import {
  applications,
  candidates,
  jobs,
  sessions,
  interviewReports,
  screeningQueue,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import {
  redeemMagicToken,
  signCandidateMagicJwt,
} from "../services/magicTokenService";
import {
  requireCandidateAuth,
  requireActiveCandidateSession,
  HrAuthRequest,
} from "../middleware/tenant";
import { emailService } from "../services/emailService";
import { renderAssessmentCompletedEmail } from "../templates/emailTemplates";
import { evaluateAndScoreSession } from "../services/scoringService";
import crypto from "crypto";

export const candidatePortalRouter = Router();

/**
 * GET /api/candidate/verify?token=<RAW_TOKEN>
 * Public single-use token redemption endpoint.
 * Atomically consumes token, binds session, and issues candidate JWT.
 */
candidatePortalRouter.get("/verify", async (req: HrAuthRequest, res: Response) => {
  const rawToken = req.query.token as string;

  if (!rawToken || rawToken.trim().length === 0) {
    return res.status(400).json({ error: "Missing required query parameter 'token'." });
  }

  const result = await redeemMagicToken(rawToken);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({
    success: true,
    token: result.jwtToken,
    application: result.application,
  });
});

/**
 * GET /api/candidate/me
 * Protected candidate dashboard state endpoint.
 */
candidatePortalRouter.get("/me", requireCandidateAuth, async (req: HrAuthRequest, res: Response) => {
  const candidateCtx = req.candidate!;

  try {
    const pool = (db as any).session?.client || (global as any)._postgresPool;
    if (!pool) return res.status(500).json({ error: "Database client unavailable." });

    const query = `
      SELECT 
        a.id, a.job_id, a.candidate_id, a.organization_id, a.status,
        a.session_id, a.created_at, a.magic_token_expires_at,
        c.name as candidate_name, c.email as candidate_email,
        j.title as job_title, j.department as job_dept, j.description as job_description,
        s.current_stage as session_stage, s.locked as session_locked,
        ir.overall_score, ir.generated_at as report_generated_at
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN sessions s ON a.session_id = s.id
      LEFT JOIN interview_reports ir ON ir.session_id = a.session_id
      WHERE a.id = $1;
    `;

    const { rows } = await pool.query(query, [candidateCtx.applicationId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Application not found." });
    }

    return res.json({
      application: rows[0],
    });
  } catch (err: any) {
    console.error("Failed to load candidate application context:", err);
    return res.status(500).json({ error: "Failed to load candidate profile." });
  }
});

/**
 * POST /api/candidate/assessment/complete
 * Triggered upon completing Phase 6 / interview stages.
 * Moves status to assessment_completed, enqueues Email #2, and executes scoring.
 */
candidatePortalRouter.post(
  "/assessment/complete",
  requireCandidateAuth,
  async (req: HrAuthRequest, res: Response) => {
    const candidateCtx = req.candidate!;
    const pool = (db as any).session?.client || (global as any)._postgresPool;
    if (!pool) return res.status(500).json({ error: "Database client unavailable." });

    try {
      // Fetch details
      const { rows } = await pool.query(
        `SELECT a.id, a.session_id, a.organization_id, c.name, c.email, j.title as job_title
         FROM applications a
         JOIN candidates c ON a.candidate_id = c.id
         JOIN jobs j ON a.job_id = j.id
         WHERE a.id = $1;`,
        [candidateCtx.applicationId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Application not found." });
      }

      const appData = rows[0];

      // Update application status
      await pool.query(
        `UPDATE applications 
         SET status = 'assessment_completed', updated_at = now() 
         WHERE id = $1;`,
        [appData.id]
      );

      // Enqueue Email #2 (Post-Assessment Confirmation)
      const confirmationEmail = renderAssessmentCompletedEmail({
        candidateName: appData.name || "Candidate",
        jobTitle: appData.job_title,
        companyName: "Ravengard Systems",
      });

      await emailService.queueEmail({
        recipientEmail: appData.email,
        recipientName: appData.name,
        templateType: "assessment_completed",
        subject: confirmationEmail.subject,
        bodyText: confirmationEmail.bodyText,
        bodyHtml: confirmationEmail.bodyHtml,
        applicationId: appData.id,
        organizationId: appData.organization_id,
      });

      // Run background scoring if sessionId is present
      if (appData.session_id) {
        evaluateAndScoreSession(appData.session_id).catch((err) => {
          console.error(`[ScoringPipeline] Async session evaluation error for ${appData.session_id}:`, err);
        });
      }

      return res.json({
        success: true,
        status: "assessment_completed",
        message: "Assessment successfully submitted. Confirmation email queued.",
      });
    } catch (err: any) {
      console.error("Assessment completion error:", err);
      return res.status(500).json({ error: "Failed to mark assessment complete." });
    }
  }
);

/**
 * GET /api/candidate/assessment/receipt
 * Generates an immutable cryptographic proof receipt of completion.
 */
candidatePortalRouter.get(
  "/assessment/receipt",
  requireCandidateAuth,
  async (req: HrAuthRequest, res: Response) => {
    const candidateCtx = req.candidate!;
    const pool = (db as any).session?.client || (global as any)._postgresPool;
    if (!pool) return res.status(500).json({ error: "Database client unavailable." });

    try {
      const { rows } = await pool.query(
        `SELECT a.id, a.session_id, a.status, a.updated_at, c.name, c.email, j.title as job_title
         FROM applications a
         JOIN candidates c ON a.candidate_id = c.id
         JOIN jobs j ON a.job_id = j.id
         WHERE a.id = $1;`,
        [candidateCtx.applicationId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Application not found." });
      }

      const app = rows[0];
      const receiptSignature = crypto
        .createHmac("sha256", process.env.JWT_SECRET || "ravengard_secret")
        .update(`${app.id}:${app.session_id}:${app.updated_at}`)
        .digest("hex");

      return res.json({
        receipt: {
          receiptId: `RCPT-${app.id.slice(0, 8).toUpperCase()}`,
          candidateName: app.name,
          candidateEmail: app.email,
          jobTitle: app.job_title,
          status: app.status,
          completionTimestamp: app.updated_at,
          cryptographicProof: receiptSignature,
          issuer: "Ravengard AI Assessment Verification Authority",
        },
      });
    } catch (err: any) {
      console.error("Failed to generate receipt:", err);
      return res.status(500).json({ error: "Failed to generate assessment receipt." });
    }
  }
);
