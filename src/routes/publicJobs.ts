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
import { eq, or, desc } from "drizzle-orm";
import crypto from "crypto";
import multer from "multer";
import { isDisposableEmail, fetchGithubInsights, getCandidateTimezone } from "../services/publicApis";
import { extractTextFromPdf } from "../services/pdfParser";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const publicJobsRouter = Router();

/**
 * GET /api/jobs
 * Lists public active & published job openings.
 */
publicJobsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const activeJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        department: jobs.department,
        location: jobs.location,
        employmentType: jobs.employmentType,
        salaryRange: jobs.salaryRange,
        description: jobs.description,
        requirementsJson: jobs.requirementsJson,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .where(or(eq(jobs.status, "active"), eq(jobs.status, "published")))
      .orderBy(desc(jobs.createdAt));

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
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job || (job.status !== "active" && job.status !== "published")) {
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
 * Public candidate application submission with Anti-Fraud Disposable Email Filter,
 * GitHub Portfolio Enrichment, Timezone SLA Resolution, and PDF Parsing.
 */
publicJobsRouter.post("/:id/apply", upload.single("resume"), async (req: Request, res: Response) => {
  const jobId = req.params.id;
  const {
    name,
    email,
    mobile,
    college,
    degree,
    gradYear,
    preferredLanguage,
    githubUsername,
  } = req.body;

  let rawResumeText = req.body.resumeText || "";

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email address is required." });
  }

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: "Candidate name is required." });
  }

  // 1. Anti-Abuse Guard: Block disposable / temporary fake email domains
  const isFake = await isDisposableEmail(email.trim());
  if (isFake) {
    return res.status(400).json({
      error: "Disposable and temporary email addresses are not permitted. Please use your verified primary work or personal email.",
    });
  }

  // 2. In-memory PDF text extraction if file was uploaded
  if (req.file && (!rawResumeText || rawResumeText.trim().length === 0)) {
    rawResumeText = await extractTextFromPdf(req.file.buffer);
  }

  // 3. Parallel Background Public API Enrichments (GitHub + Timezone)
  const candidateIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.ip || "127.0.0.1";
  const [githubData, locationInfo] = await Promise.all([
    githubUsername ? fetchGithubInsights(String(githubUsername)) : Promise.resolve(null),
    getCandidateTimezone(candidateIp),
  ]);

  const pool = (db as any).session?.client || (global as any)._postgresPool;
  if (!pool) return res.status(500).json({ error: "Database client unavailable." });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verify job exists and is live
    const jobResult = await client.query(
      `SELECT id, organization_id, title, status, screening_threshold 
       FROM jobs 
       WHERE id = $1 AND (status = 'active' OR status = 'published');`,
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Job not found or closed to new applications." });
    }

    const job = jobResult.rows[0];

    // Upsert candidate with enriched metadata
    const candidateId = `cand-${crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex").slice(0, 16)}`;
    await client.query(
      `INSERT INTO candidates (
         id, email, name, mobile, college, degree, grad_year, preferred_language, organization_id,
         resume_text, github_username, github_data, timezone, country
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         mobile = COALESCE(EXCLUDED.mobile, candidates.mobile),
         college = COALESCE(EXCLUDED.college, candidates.college),
         degree = COALESCE(EXCLUDED.degree, candidates.degree),
         grad_year = COALESCE(EXCLUDED.grad_year, candidates.grad_year),
         resume_text = COALESCE(EXCLUDED.resume_text, candidates.resume_text),
         github_data = COALESCE(EXCLUDED.github_data, candidates.github_data),
         timezone = COALESCE(EXCLUDED.timezone, candidates.timezone),
         country = COALESCE(EXCLUDED.country, candidates.country);`,
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
        rawResumeText ? String(rawResumeText).slice(0, 4000) : null,
        githubUsername ? String(githubUsername).trim() : null,
        githubData ? JSON.stringify(githubData) : null,
        locationInfo.timezone,
        locationInfo.country,
      ]
    );

    // Check for existing application
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

    // Initialize session
    const sessionId = `sess-${crypto.randomUUID()}`;
    await client.query(
      `INSERT INTO sessions (id, candidate_id, current_stage, status, locked)
       VALUES ($1, $2, 'resume_analysis', 'active', true);`,
      [sessionId, candidateId]
    );

    if (rawResumeText && String(rawResumeText).trim().length > 0) {
      await client.query(
        `INSERT INTO resume_analyses (id, session_id, raw_resume_text)
         VALUES ($1, $2, $3);`,
        [`ra-${crypto.randomUUID()}`, sessionId, String(rawResumeText).trim()]
      );
    }

    // Create application record with strict 24-Hour SLA Timer
    const applicationId = `app-${crypto.randomUUID()}`;
    const slaExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await client.query(
      `INSERT INTO applications (
         id, job_id, candidate_id, organization_id, status, session_id, assessment_expires_at, sla_expires_at
       )
       VALUES ($1, $2, $3, $4, 'applied', $5, $6, $6);`,
      [applicationId, jobId, candidateId, job.organization_id, sessionId, slaExpiresAt]
    );

    // Enqueue into screening_queue for async matching
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
      enrichment: {
        timezone: locationInfo.timezone,
        githubInsights: githubData ? { repoCount: githubData.publicRepoCount, languages: githubData.topLanguages } : null,
      },
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Failed to submit application:", err);
    return res.status(500).json({ error: "Failed to process job application." });
  } finally {
    client.release();
  }
});
