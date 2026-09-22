import { Router, Response } from "express";
import { db } from "../db/index";
import {
  jobs,
  applications,
  candidates,
  aiScreeningResults,
  sessions,
  interviewReports,
  integritySignals,
  adminLogs,
  screeningQueue,
  apiKeys,
  integrationConfigs,
  outboxEvents,
  adminUsers,
} from "../db/schema";
import { eq, and, desc, sql, inArray, isNull } from "drizzle-orm";
import { requireHrAuth, HrAuthRequest } from "../middleware/tenant";
import { generateMagicToken } from "../services/magicTokenService";
import { emailService } from "../services/emailService";
import {
  renderShortlistInvitationEmail,
  renderNonSelectionRejectionEmail,
} from "../templates/emailTemplates";
import { signAdminToken } from "../middleware/auth";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const hrRouter = Router();

/**
 * POST /api/hr/login
 * Public authentication endpoint for HR team members.
 * Validates role and scopes to organization.
 */
hrRouter.post("/login", async (req, res) => {
  const body = req.body || {};
  const identifier = String(body.email || "").trim().toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifier || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, identifier))
      .limit(1);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const allowedRoles = ["hr_admin", "hr_user", "recruiter", "hiring_manager", "super_admin", "admin"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Account not authorized for HR portal access." });
    }

    const orgId = user.organizationId || "org-ravengard";
    const token = signAdminToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: orgId,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: orgId,
      },
    });
  } catch (err: any) {
    console.error("HR login error:", err);
    return res.status(500).json({ error: "Failed to process login." });
  }
});

// Apply tenant-isolated auth to all remaining /api/hr routes
hrRouter.use(requireHrAuth);

/**
 * GET /api/hr/me
 * Returns current HR user context & organization details.
 */
hrRouter.get("/me", async (req: HrAuthRequest, res: Response) => {
  return res.json({
    user: req.hr,
  });
});

/**
 * POST /api/hr/jobs
 * Creates a new Job Post scoped to HR's organization.
 */
hrRouter.post("/jobs", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const {
    title,
    department,
    description,
    requirementsJson,
    screeningThreshold,
    requireHumanRejectionApproval,
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Missing required fields: title and description." });
  }

  const id = `job-${crypto.randomUUID()}`;

  try {
    const [newJob] = await db
      .insert(jobs)
      .values({
        id,
        organizationId: orgId,
        title: title.trim(),
        department: department ? department.trim() : null,
        description: description.trim(),
        requirementsJson: requirementsJson || {},
        screeningThreshold: typeof screeningThreshold === "number" ? screeningThreshold : 70,
        requireHumanRejectionApproval:
          requireHumanRejectionApproval !== undefined
            ? Boolean(requireHumanRejectionApproval)
            : true,
        status: "active",
      })
      .returning();

    // Audit log
    await db.insert(adminLogs).values({
      id: `log-${crypto.randomUUID()}`,
      adminId: req.hr!.id,
      organizationId: orgId,
      action: "JOB_CREATED",
      target: id,
      metadata: { title, department },
    });

    return res.status(201).json({ job: newJob });
  } catch (err: any) {
    console.error("Failed to create job:", err);
    return res.status(500).json({ error: "Failed to create job posting." });
  }
});

/**
 * GET /api/hr/jobs
 * Lists all jobs strictly scoped to HR user's organization.
 */
hrRouter.get("/jobs", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;

  try {
    const allJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.organizationId, orgId))
      .orderBy(desc(jobs.createdAt));

    // Also get application count summary per job
    const pool = (db as any).session?.client || (global as any)._postgresPool;
    let countsMap: Record<string, any> = {};

    if (pool) {
      const countsResult = await pool.query(
        `SELECT job_id, count(*)::int as total,
                count(*) FILTER (WHERE status = 'shortlisted')::int as shortlisted,
                count(*) FILTER (WHERE status = 'pending_rejection_review')::int as pending_review,
                count(*) FILTER (WHERE status = 'assessment_completed')::int as completed,
                count(*) FILTER (WHERE status = 'recommended')::int as recommended
         FROM applications
         WHERE organization_id = $1
         GROUP BY job_id;`,
        [orgId]
      );
      for (const row of countsResult.rows) {
        countsMap[row.job_id] = row;
      }
    }

    const enrichedJobs = allJobs.map((j) => ({
      ...j,
      metrics: countsMap[j.id] || {
        total: 0,
        shortlisted: 0,
        pending_review: 0,
        completed: 0,
        recommended: 0,
      },
    }));

    return res.json({ jobs: enrichedJobs });
  } catch (err: any) {
    console.error("Failed to list jobs:", err);
    return res.status(500).json({ error: "Failed to fetch organization jobs." });
  }
});

/**
 * PATCH /api/hr/jobs/:id
 * Updates job configuration with strict tenant verification.
 */
hrRouter.patch("/jobs/:id", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const jobId = req.params.id;
  const {
    title,
    department,
    description,
    requirementsJson,
    screeningThreshold,
    requireHumanRejectionApproval,
    status,
  } = req.body;

  try {
    const [existing] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Job posting not found in this organization." });
    }

    const updates: any = { updatedAt: new Date() };
    if (title) updates.title = title.trim();
    if (department !== undefined) updates.department = department?.trim() || null;
    if (description) updates.description = description.trim();
    if (requirementsJson !== undefined) updates.requirementsJson = requirementsJson;
    if (screeningThreshold !== undefined) updates.screeningThreshold = Number(screeningThreshold);
    if (requireHumanRejectionApproval !== undefined) {
      updates.requireHumanRejectionApproval = Boolean(requireHumanRejectionApproval);
    }
    if (status) updates.status = status;

    const [updatedJob] = await db
      .update(jobs)
      .set(updates)
      .where(and(eq(jobs.id, jobId), eq(jobs.organizationId, orgId)))
      .returning();

    await db.insert(adminLogs).values({
      id: `log-${crypto.randomUUID()}`,
      adminId: req.hr!.id,
      organizationId: orgId,
      action: "JOB_UPDATED",
      target: jobId,
      metadata: updates,
    });

    return res.json({ job: updatedJob });
  } catch (err: any) {
    console.error("Failed to update job:", err);
    return res.status(500).json({ error: "Failed to update job." });
  }
});

/**
 * GET /api/hr/applications
 * Returns ATS Pipeline applications scoped to HR's organization.
 * Supports filtering by jobId and view tab ('all', 'pre_screened', 'post_assessment', 'pending_rejection_review').
 */
hrRouter.get("/applications", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const { jobId, tab, search } = req.query;

  const pool = (db as any).session?.client || (global as any)._postgresPool;
  if (!pool) return res.status(500).json({ error: "Database client unavailable." });

  try {
    let query = `
      SELECT 
        a.id, a.job_id, a.candidate_id, a.organization_id, a.status,
        a.session_id, a.magic_token_expires_at, a.magic_token_used_at,
        a.created_at, a.updated_at,
        c.name as candidate_name, c.email as candidate_email, c.college, c.degree, c.grad_year,
        j.title as job_title, j.department as job_dept, j.screening_threshold,
        asr.match_score, asr.strengths_summary, asr.gaps_summary, asr.full_rationale_json,
        ir.overall_score, ir.recommendation as assessment_recommendation, ir.breakdown,
        (SELECT count(*)::int FROM integrity_signals WHERE session_id = a.session_id) as integrity_flags_count
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN ai_screening_results asr ON asr.application_id = a.id
      LEFT JOIN interview_reports ir ON ir.session_id = a.session_id
      WHERE a.organization_id = $1
    `;

    const params: any[] = [orgId];

    if (jobId) {
      params.push(jobId);
      query += ` AND a.job_id = $${params.length}`;
    }

    if (tab === "pre_screened") {
      query += ` AND a.status IN ('shortlisted', 'rejected_at_screening', 'pending_rejection_review')`;
    } else if (tab === "pending_rejection_review") {
      query += ` AND a.status = 'pending_rejection_review'`;
    } else if (tab === "post_assessment") {
      query += ` AND a.status IN ('assessment_completed', 'recommended', 'not_recommended')`;
    }

    if (search && String(search).trim().length > 0) {
      params.push(`%${String(search).trim()}%`);
      query += ` AND (c.name ILIKE $${params.length} OR c.email ILIKE $${params.length} OR j.title ILIKE $${params.length})`;
    }

    query += ` ORDER BY a.created_at DESC;`;

    const { rows } = await pool.query(query, params);

    return res.json({ applications: rows });
  } catch (err: any) {
    console.error("Failed to query HR applications:", err);
    return res.status(500).json({ error: "Failed to retrieve applications." });
  }
});

/**
 * GET /api/hr/applications/:id
 * Detailed candidate dossier with full AI rationale, question breakdown, citations, and integrity flags.
 */
hrRouter.get("/applications/:id", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const appId = req.params.id;

  const pool = (db as any).session?.client || (global as any)._postgresPool;
  if (!pool) return res.status(500).json({ error: "Database client unavailable." });

  try {
    const appQuery = `
      SELECT 
        a.*,
        c.name as candidate_name, c.email as candidate_email, c.college, c.degree, c.grad_year, c.mobile,
        j.title as job_title, j.department as job_dept, j.description as job_description, j.requirements_json,
        asr.match_score, asr.strengths_summary, asr.gaps_summary, asr.full_rationale_json,
        ir.overall_score, ir.breakdown, ir.strengths as interview_strengths, ir.weaknesses as interview_weaknesses,
        ir.recommendation as interview_recommendation, ir.evidence, ir.generated_at as report_generated_at,
        ra.raw_resume_text
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN ai_screening_results asr ON asr.application_id = a.id
      LEFT JOIN interview_reports ir ON ir.session_id = a.session_id
      LEFT JOIN resume_analyses ra ON ra.session_id = a.session_id
      WHERE a.id = $1 AND a.organization_id = $2;
    `;

    const { rows } = await pool.query(appQuery, [appId, orgId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Application not found in this organization." });
    }

    const application = rows[0];

    // Fetch integrity signals if session exists
    let signals: any[] = [];
    let transcript: any[] = [];

    if (application.session_id) {
      const sigResult = await pool.query(
        `SELECT * FROM integrity_signals WHERE session_id = $1 ORDER BY timestamp ASC;`,
        [application.session_id]
      );
      signals = sigResult.rows;

      // Fetch transcript Q&A
      const transcriptResult = await pool.query(
        `SELECT 
           q.id as question_id, q.question_index, q.question_text, q.generated_at,
           r.response_text, r.submitted_at
         FROM interview_questions q
         JOIN interview_sessions isess ON q.interview_session_id = isess.id
         LEFT JOIN interview_responses r ON r.question_id = q.id
         WHERE isess.session_id = $1
         ORDER BY q.question_index ASC;`,
        [application.session_id]
      );
      transcript = transcriptResult.rows;
    }

    return res.json({
      application,
      signals,
      transcript,
    });
  } catch (err: any) {
    console.error("Failed to get application dossier:", err);
    return res.status(500).json({ error: "Failed to load application dossier." });
  }
});

/**
 * POST /api/hr/applications/:id/status
 * Manual status override by authorized HR user. Audited in admin_logs.
 */
hrRouter.post("/applications/:id/status", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const appId = req.params.id;
  const { status, reason } = req.body;

  const validStatuses = [
    "applied",
    "shortlisted",
    "rejected_at_screening",
    "pending_rejection_review",
    "assessment_pending",
    "assessment_in_progress",
    "assessment_completed",
    "recommended",
    "not_recommended",
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  try {
    const [existing] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.id, appId), eq(applications.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "Application not found in your organization." });
    }

    const [updated] = await db
      .update(applications)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(applications.id, appId), eq(applications.organizationId, orgId)))
      .returning();

    // Audit log
    await db.insert(adminLogs).values({
      id: `log-${crypto.randomUUID()}`,
      adminId: req.hr!.id,
      organizationId: orgId,
      action: "APPLICATION_STATUS_OVERRIDE",
      target: appId,
      metadata: {
        previousStatus: existing.status,
        newStatus: status,
        reason: reason || "Manual HR decision",
        performedBy: req.hr!.email,
      },
    });

    return res.json({ success: true, application: updated });
  } catch (err: any) {
    console.error("Status override error:", err);
    return res.status(500).json({ error: "Failed to update application status." });
  }
});

/**
 * POST /api/hr/applications/batch-approve-rejections
 * Human-in-the-Loop Safeguard:
 * Atomically approves pending rejections and dispatches Email #3 with polite constructive feedback.
 */
hrRouter.post("/applications/batch-approve-rejections", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const { applicationIds } = req.body;

  const pool = (db as any).session?.client || (global as any)._postgresPool;
  if (!pool) return res.status(500).json({ error: "Database client unavailable." });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let query = `
      SELECT 
        a.id, a.job_id, a.candidate_id,
        c.name as candidate_name, c.email as candidate_email,
        j.title as job_title,
        asr.gaps_summary, asr.full_rationale_json
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN ai_screening_results asr ON asr.application_id = a.id
      WHERE a.organization_id = $1 AND a.status = 'pending_rejection_review'
    `;

    const params: any[] = [orgId];

    if (Array.isArray(applicationIds) && applicationIds.length > 0) {
      params.push(applicationIds);
      query += ` AND a.id = ANY($2::text[])`;
    }

    query += ` FOR UPDATE OF a;`;

    const { rows } = await client.query(query, params);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.json({ message: "No applications pending rejection review were matched.", count: 0 });
    }

    const approvedIds = rows.map((r: any) => r.id);

    // Update status to rejected_at_screening
    await client.query(
      `UPDATE applications
       SET status = 'rejected_at_screening', updated_at = now()
       WHERE id = ANY($1::text[]);`,
      [approvedIds]
    );

    // Audit log
    await client.query(
      `INSERT INTO admin_logs (id, admin_id, organization_id, action, target, metadata)
       VALUES ($1, $2, $3, 'BATCH_REJECTIONS_APPROVED', $4, $5);`,
      [
        `log-${crypto.randomUUID()}`,
        req.hr!.id,
        orgId,
        `batch-count-${approvedIds.length}`,
        JSON.stringify({ approvedCount: approvedIds.length, applicationIds: approvedIds }),
      ]
    );

    // Queue Email #3 for each approved rejection
    for (const app of rows) {
      const feedback =
        app.full_rationale_json?.constructiveFeedback ||
        "Our team prioritized depth in required technical competencies for this specific role.";

      const rejectionEmail = renderNonSelectionRejectionEmail({
        candidateName: app.candidate_name || "Candidate",
        jobTitle: app.job_title,
        constructiveFeedback: feedback,
      });

      await emailService.queueEmail({
        recipientEmail: app.candidate_email,
        recipientName: app.candidate_name,
        templateType: "non_selection_rejection",
        subject: rejectionEmail.subject,
        bodyText: rejectionEmail.bodyText,
        bodyHtml: rejectionEmail.bodyHtml,
        applicationId: app.id,
        organizationId: orgId,
      });
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      count: approvedIds.length,
      message: `Successfully approved and queued rejection notifications for ${approvedIds.length} candidate(s).`,
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Failed to batch approve rejections:", err);
    return res.status(500).json({ error: "Failed to process batch rejection approval." });
  } finally {
    client.release();
  }
});

/**
 * POST /api/hr/applications/:id/reset-magic-link
 * Allows HR to reset/re-issue a fresh 48-hour assessment link if candidate experienced a glitch.
 */
hrRouter.post("/applications/:id/reset-magic-link", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const appId = req.params.id;
  const appUrl = (process.env.APP_URL || "").trim();

  try {
    const [app] = await db
      .select({
        id: applications.id,
        candidateId: applications.candidateId,
        jobId: applications.jobId,
        status: applications.status,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        jobTitle: jobs.title,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(and(eq(applications.id, appId), eq(applications.organizationId, orgId)))
      .limit(1);

    if (!app) {
      return res.status(404).json({ error: "Application not found." });
    }

    const newMagicToken = generateMagicToken(appUrl);

    await db
      .update(applications)
      .set({
        magicTokenHash: newMagicToken.tokenHash,
        magicTokenExpiresAt: newMagicToken.expiresAt,
        magicTokenUsedAt: null,
        status: "shortlisted",
        updatedAt: new Date(),
      })
      .where(eq(applications.id, appId));

    // Re-dispatch Email #1
    const email = renderShortlistInvitationEmail({
      candidateName: app.candidateName || "Candidate",
      jobTitle: app.jobTitle,
      companyName: "Ravengard Systems",
      magicAssessmentLink: newMagicToken.magicLinkUrl,
    });

    await emailService.queueEmail({
      recipientEmail: app.candidateEmail,
      recipientName: app.candidateName || undefined,
      templateType: "shortlist_invitation",
      subject: email.subject,
      bodyText: email.bodyText,
      bodyHtml: email.bodyHtml,
      applicationId: appId,
      organizationId: orgId,
    });

    await db.insert(adminLogs).values({
      id: `log-${crypto.randomUUID()}`,
      adminId: req.hr!.id,
      organizationId: orgId,
      action: "MAGIC_LINK_RESET",
      target: appId,
      metadata: { candidateEmail: app.candidateEmail },
    });

    return res.json({
      success: true,
      magicLinkUrl: newMagicToken.magicLinkUrl,
      message: "Magic assessment link refreshed and emailed to candidate.",
    });
  } catch (err: any) {
    console.error("Failed to reset magic link:", err);
    return res.status(500).json({ error: "Failed to reset magic link." });
  }
});

/**
 * POST /api/hr/applications/:id/telemetry/clear
 * False-Positive Telemetry Clear Button: Allows HR to dismiss anti-cheat flags (e.g., candidate using scratchpad) with audit note.
 */
hrRouter.post("/applications/:id/telemetry/clear", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const appId = req.params.id;
  const { reason, signalId } = req.body;

  const pool = (db as any).session?.client || (global as any)._postgresPool;
  if (!pool) return res.status(500).json({ error: "Database client unavailable." });

  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.session_id FROM applications a WHERE a.id = $1 AND a.organization_id = $2;`,
      [appId, orgId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Application not found." });
    }

    const sessionId = rows[0].session_id;
    if (!sessionId) {
      return res.status(400).json({ error: "No active interview session associated with this application." });
    }

    if (signalId) {
      await pool.query(
        `DELETE FROM integrity_signals WHERE id = $1 AND session_id = $2;`,
        [signalId, sessionId]
      );
    } else {
      // Clear all signals for this session
      await pool.query(
        `DELETE FROM integrity_signals WHERE session_id = $1;`,
        [sessionId]
      );
    }

    // Unflag session if flagged
    await pool.query(
      `UPDATE sessions SET flagged = false, flag_reason = NULL WHERE id = $1;`,
      [sessionId]
    );

    await db.insert(adminLogs).values({
      id: `log-${crypto.randomUUID()}`,
      adminId: req.hr!.id,
      organizationId: orgId,
      action: "TELEMETRY_FLAG_CLEARED",
      target: appId,
      metadata: {
        reason: reason || "Recruiter verified valid candidate explanation",
        signalId: signalId || "ALL_SIGNALS",
        clearedBy: req.hr!.email,
      },
    });

    return res.json({ success: true, message: "Telemetry signal cleared successfully." });
  } catch (err: any) {
    console.error("Failed to clear telemetry:", err);
    return res.status(500).json({ error: "Failed to clear telemetry flag." });
  }
});

/**
 * GET /api/hr/settings/api-keys
 * Lists active tenant API keys (with prefix masking).
 */
hrRouter.get("/settings/api-keys", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;

  try {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.organizationId, orgId), isNull(apiKeys.revokedAt)))
      .orderBy(desc(apiKeys.createdAt));

    return res.json({ success: true, keys });
  } catch (err: any) {
    console.error("Failed to fetch API keys:", err);
    return res.status(500).json({ error: "Failed to fetch API keys." });
  }
});

/**
 * POST /api/hr/settings/api-keys
 * Generates a new tenant-scoped API key ('rg_live_...').
 * Returns raw key EXACTLY ONCE to the user.
 */
hrRouter.post("/settings/api-keys", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const { name, scopes } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "API key name is required." });
  }

  try {
    // Generate 32 bytes of cryptographic entropy
    const randomHex = crypto.randomBytes(32).toString("hex");
    const rawKey = `rg_live_${randomHex}`;
    const keyPrefix = `rg_live_${randomHex.substring(0, 8)}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    const keyId = `key-${crypto.randomUUID()}`;
    const allowedScopes = Array.isArray(scopes) && scopes.length > 0 ? scopes : ["candidates:read", "candidates:write"];

    await db.insert(apiKeys).values({
      id: keyId,
      organizationId: orgId,
      name: name.trim(),
      keyPrefix,
      keyHash,
      scopes: allowedScopes,
    });

    await db.insert(adminLogs).values({
      id: `log-${crypto.randomUUID()}`,
      adminId: req.hr!.id,
      organizationId: orgId,
      action: "API_KEY_CREATED",
      target: keyId,
      metadata: { keyName: name.trim(), keyPrefix },
    });

    return res.status(201).json({
      success: true,
      id: keyId,
      name: name.trim(),
      keyPrefix,
      key: rawKey,
      scopes: allowedScopes,
      message: "API key generated successfully. Copy and store this secret key now; you will not be able to view it again.",
    });
  } catch (err: any) {
    console.error("Failed to create API key:", err);
    return res.status(500).json({ error: "Failed to create API key." });
  }
});

/**
 * DELETE /api/hr/settings/api-keys/:id
 * Soft-deletes / revokes an API key.
 */
hrRouter.delete("/settings/api-keys/:id", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const keyId = req.params.id;

  try {
    const [existing] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.organizationId, orgId)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: "API key not found." });
    }

    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(eq(apiKeys.id, keyId));

    await db.insert(adminLogs).values({
      id: `log-${crypto.randomUUID()}`,
      adminId: req.hr!.id,
      organizationId: orgId,
      action: "API_KEY_REVOKED",
      target: keyId,
      metadata: { keyPrefix: existing.keyPrefix },
    });

    return res.json({ success: true, message: "API key successfully revoked." });
  } catch (err: any) {
    console.error("Failed to revoke API key:", err);
    return res.status(500).json({ error: "Failed to revoke API key." });
  }
});

/**
 * GET /api/hr/settings/integrations
 * Retrieves tenant integration status for Greenhouse, Lever, and Workday.
 */
hrRouter.get("/settings/integrations", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;

  try {
    const configs = await db
      .select({
        id: integrationConfigs.id,
        provider: integrationConfigs.provider,
        apiEndpoint: integrationConfigs.apiEndpoint,
        isEnabled: integrationConfigs.isEnabled,
        updatedAt: integrationConfigs.updatedAt,
      })
      .from(integrationConfigs)
      .where(eq(integrationConfigs.organizationId, orgId));

    const providers = ["greenhouse", "lever", "workday"].map((p) => {
      const found = configs.find((c) => c.provider === p);
      return {
        provider: p,
        isEnabled: found?.isEnabled || false,
        apiEndpoint: found?.apiEndpoint || "",
        webhookUrl: `/api/v1/integrations/webhooks/${p}`,
        isConfigured: !!found,
      };
    });

    return res.json({ success: true, providers });
  } catch (err: any) {
    console.error("Failed to get integration configs:", err);
    return res.status(500).json({ error: "Failed to get integration configs." });
  }
});

/**
 * POST /api/hr/settings/integrations
 * Configures or updates an ATS provider.
 */
hrRouter.post("/settings/integrations", async (req: HrAuthRequest, res: Response) => {
  const orgId = req.hr!.organizationId;
  const { provider, webhookSecret, apiEndpoint, isEnabled } = req.body;

  if (!provider || !["greenhouse", "lever", "workday"].includes(provider)) {
    return res.status(400).json({ error: "Invalid provider. Must be greenhouse, lever, or workday." });
  }

  try {
    const [existing] = await db
      .select()
      .from(integrationConfigs)
      .where(and(eq(integrationConfigs.organizationId, orgId), eq(integrationConfigs.provider, provider)))
      .limit(1);

    if (existing) {
      await db
        .update(integrationConfigs)
        .set({
          webhookSecret: webhookSecret || existing.webhookSecret,
          apiEndpoint: apiEndpoint !== undefined ? apiEndpoint : existing.apiEndpoint,
          isEnabled: isEnabled !== undefined ? isEnabled : existing.isEnabled,
          updatedAt: new Date(),
        })
        .where(eq(integrationConfigs.id, existing.id));
    } else {
      await db.insert(integrationConfigs).values({
        id: `ic-${crypto.randomUUID()}`,
        organizationId: orgId,
        provider,
        webhookSecret: webhookSecret || null,
        apiEndpoint: apiEndpoint || null,
        encryptedCredentials: {},
        isEnabled: isEnabled !== undefined ? isEnabled : true,
      });
    }

    return res.json({ success: true, message: `${provider} integration updated successfully.` });
  } catch (err: any) {
    console.error("Failed to save integration config:", err);
    return res.status(500).json({ error: "Failed to update integration config." });
  }
});

