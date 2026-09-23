import { Router, Request, Response } from "express";
import { db } from "../db/index";
import {
  jobs,
  candidates,
  applications,
  sessions,
  resumeAnalyses,
  screeningQueue,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

export const publicJobsRouter = Router();

/**
 * GET /api/jobs
 * Lists public active job openings.
 */
publicJobsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const activeJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        department: jobs.department,
        description: jobs.description,
        requirementsJson: jobs.requirementsJson,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .where(eq(jobs.status, "active"));

    return res.json({ jobs: activeJobs });
  } catch (err: any) {
    console.error("Failed to list public jobs:", err);
    return res.status(500).json({ error: "Failed to load jobs." });
  }
});

/**
 * GET /api/jobs/:id
 * Returns public details for a single job opening.
 */
publicJobsRouter.get("/:id", async (req: Request, res: Response) => {
  const jobId = req.params.id;

  try {
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.status, "active")))
      .limit(1);

    if (!job) {
      return res.status(404).json({ error: "Job posting not found or no longer active." });
    }

    return res.json({ job });
  } catch (err: any) {
    console.error("Failed to get job:", err);
    return res.status(500).json({ error: "Failed to load job." });
  }
});

/**
 * POST /api/jobs/:id/apply
 * Public candidate application submission.
 * Enqueues resume matching asynchronously to avoid 504 Gateway Timeouts.
 */
publicJobsRouter.post("/:id/apply", async (req: Request, res: Response) => {
  const jobId = req.params.id;
  const {
    name,
    email,
    mobile,
    college,
    degree,
    gradYear,
    preferredLanguage,
    resumeText,
  } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email address is required." });
  }

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Candidate name is required." });
  }

  const pool = (db as any).session?.client || (global as any)._postgresPool;
  if (!pool) return res.status(500).json({ error: "Database client unavailable." });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verify job exists and is active
    const jobResult = await client.query(
      `SELECT id, organization_id, title, status, screening_threshold 
       FROM jobs 
       WHERE id = $1 AND status = 'active';`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Job not found or closed to new applications." });
    }

    const job = jobResult.rows[0];

    // 2. Upsert candidate
    const candidateId = `cand-${crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex").slice(0, 16)}`;
    await client.query(
      `INSERT INTO candidates (
         id, email, name, mobile, college, degree, grad_year, preferred_language, organization_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         mobile = COALESCE(EXCLUDED.mobile, candidates.mobile),
         college = COALESCE(EXCLUDED.college, candidates.college),
         degree = COALESCE(EXCLUDED.degree, candidates.degree),
         grad_year = COALESCE(EXCLUDED.grad_year, candidates.grad_year);`,
      [
        candidateId,
        email.toLowerCase().trim(),
        name.trim(),
        mobile ? String(mobile).trim() : null,
        college ? String(college).trim() : null,
        degree ? String(degree).trim() : null,
        gradYear ? Number(gradYear) : null,
        preferredLanguage ? String(preferredLanguage).trim() : "en",
        job.organization_id,
      ]
    );

    // 3. Check for existing application to this job
    const existingAppResult = await client.query(
      `SELECT id, status FROM applications WHERE candidate_id = $1 AND job_id = $2;`,
      [candidateId, jobId]
    );

    if (existingAppResult.rows.length > 0) {
      await client.query("ROLLBACK");
      const existing = existingAppResult.rows[0];
      return res.status(409).json({
        error: "You have already applied for this role.",
        applicationId: existing.id,
        status: existing.status,
      });
    }

    // 4. Initialize session and store resume
    const sessionId = `sess-${crypto.randomUUID()}`;
    await client.query(
      `INSERT INTO sessions (id, candidate_id, current_stage, status, locked)
       VALUES ($1, $2, 'resume_analysis', 'active', true);`,
      [sessionId, candidateId]
    );

    if (resumeText && String(resumeText).trim().length > 0) {
      await client.query(
        `INSERT INTO resume_analyses (id, session_id, raw_resume_text)
         VALUES ($1, $2, $3);`,
        [`ra-${crypto.randomUUID()}`, sessionId, String(resumeText).trim()]
      );
    }

    // 5. Create application record with strict 24-Hour SLA Timer
    const applicationId = `app-${crypto.randomUUID()}`;
    const slaExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO applications (
         id, job_id, candidate_id, organization_id, status, session_id, assessment_expires_at, sla_expires_at
       )
       VALUES ($1, $2, $3, $4, 'applied', $5, $6, $6);`,
      [applicationId, jobId, candidateId, job.organization_id, sessionId, slaExpiresAt]
    );

    // 6. Enqueue into screening_queue for asynchronous background matching
    const queueId = `q-${crypto.randomUUID()}`;
    await client.query(
      `INSERT INTO screening_queue (id, application_id, organization_id, status)
       VALUES ($1, $2, $3, 'pending');`,
      [queueId, applicationId, job.organization_id]
    );

    await client.query("COMMIT");

    const { signCandidateProfileJwt } = await import("../services/magicTokenService");
    const candidateToken = signCandidateProfileJwt({
      id: candidateId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
    });

    return res.status(201).json({
      success: true,
      applicationId,
      candidateId,
      token: candidateToken,
      status: "applied",
      slaExpiresAt,
      portalUrl: `/portal`,
      message: "Application received! 24-hour assessment window has started. Complete your assessment before the deadline.",
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Failed to submit application:", err);
    return res.status(500).json({ error: "Failed to process job application." });
  } finally {
    client.release();
  }
});
