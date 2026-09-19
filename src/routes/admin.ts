import { Router } from "express";
import { db } from "../db/index";
import {
  candidates,
  sessions,
  interviewReports,
  interviewSessions,
  interviewQuestions,
  interviewResponses,
  questionScores,
} from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { authAdmin, requireRole, AdminAuthRequest } from "../middleware/admin";
import { logAdminAction } from "../lib/auditLogger";
import crypto from "crypto";

const router = Router();

// All /api/admin/* routes require a valid admin JWT and an admin_users record.
// requireAuth verifies the JWT signature.
// authAdmin verifies the isAdmin claim and looks up the role in admin_users.
router.use(requireAuth);
router.use(authAdmin as any);

// ─── GET /api/admin/me ────────────────────────────────────────────────────────
// Minimum role: viewer
router.get("/me", async (req, res) => {
  const adminReq = req as AdminAuthRequest;
  res.json({
    success: true,
    admin: adminReq.admin,
    user: adminReq.user,
  });
});

// ─── GET /api/admin/candidates ───────────────────────────────────────────────
// Minimum role: viewer
router.get("/candidates", async (req, res) => {
  try {
    const allCandidates = await db.select().from(candidates).orderBy(desc(candidates.createdAt));
    res.json({ success: true, candidates: allCandidates });
  } catch (e) {
    console.error("admin/candidates error:", e);
    res.status(500).json({ error: "Failed to fetch candidates." });
  }
});

// ─── GET /api/admin/candidates/:id ───────────────────────────────────────────
// Minimum role: viewer
router.get("/candidates/:id", async (req, res) => {
  try {
    const candidateId = req.params.id;

    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found." });
    }

    const candidateSessions = await db
      .select({
        id: sessions.id,
        currentStage: sessions.currentStage,
        status: sessions.status,
        locked: sessions.locked,
        createdAt: sessions.createdAt,
        overallScore: interviewReports.overallScore,
        recommendation: interviewReports.recommendation,
      })
      .from(sessions)
      .leftJoin(interviewReports, eq(sessions.id, interviewReports.sessionId))
      .where(eq(sessions.candidateId, candidateId))
      .orderBy(desc(sessions.createdAt));

    const adminReq = req as AdminAuthRequest;
    await logAdminAction({
      adminId: adminReq.admin!.id,
      role: adminReq.admin!.role,
      action: "view_candidate",
      target: `candidate:${candidateId}`,
      requestId: (req as any).requestId,
      ip: req.ip,
    });

    res.json({ success: true, candidate, sessions: candidateSessions });
  } catch (e) {
    console.error("admin/candidates/:id error:", e);
    res.status(500).json({ error: "Failed to fetch candidate details." });
  }
});

// ─── GET /api/admin/sessions ─────────────────────────────────────────────────
// Minimum role: viewer
router.get("/sessions", async (req, res) => {
  try {
    const allSessions = await db
      .select({
        id: sessions.id,
        candidateId: sessions.candidateId,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        currentStage: sessions.currentStage,
        status: sessions.status,
        flagged: sessions.flagged,
        createdAt: sessions.createdAt,
        overallScore: interviewReports.overallScore,
        recommendation: interviewReports.recommendation,
        evidence: interviewReports.evidence,
      })
      .from(sessions)
      .leftJoin(candidates, eq(sessions.candidateId, candidates.id))
      .leftJoin(interviewReports, eq(sessions.id, interviewReports.sessionId))
      .orderBy(desc(sessions.createdAt));

    const enrichedSessions = allSessions.map((s) => {
      // Opt-in copilot digest: No automated hire/reject decision tags
      let recruiterStatus = "Portfolio Ready";
      if (s.flagged) {
        recruiterStatus = "Human Review Flagged";
      } else if (s.status === "in_progress") {
        recruiterStatus = "Walkthrough In Progress";
      } else if (s.overallScore !== null) {
        recruiterStatus = "Ready for Panel Review";
      }

      return {
        ...s,
        recommendation: recruiterStatus,
        fairnessScore: null,
      };
    });

    res.json({ success: true, sessions: enrichedSessions });
  } catch (e) {
    console.error("admin/sessions error:", e);
    res.status(500).json({ error: "Failed to fetch sessions." });
  }
});

// ─── GET /api/admin/sessions/:id ─────────────────────────────────────────────
// Minimum role: viewer
router.get("/sessions/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;

    const [sessionData] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!sessionData) {
      return res.status(404).json({ error: "Session not found." });
    }

    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, sessionData.candidateId!))
      .limit(1);

    const reports = await db
      .select()
      .from(interviewReports)
      .where(eq(interviewReports.sessionId, sessionId));

    // Correct join path: sessions → interview_sessions → interview_questions → interview_responses
    const interviewSessionRows = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.sessionId, sessionId));

    let transcript: { question: string | null; response: string | null; questionIndex?: number }[] = [];
    for (const ivSession of interviewSessionRows) {
      const qs = await db
        .select({
          question: interviewQuestions.questionText,
          response: interviewResponses.responseText,
          questionIndex: interviewQuestions.questionIndex,
        })
        .from(interviewQuestions)
        .leftJoin(interviewResponses, eq(interviewQuestions.id, interviewResponses.questionId))
        .where(eq(interviewQuestions.interviewSessionId, ivSession.id))
        .orderBy(interviewQuestions.questionIndex);
      transcript = transcript.concat(qs);
    }

    const activeReport = reports[0] || null;

    const sessionQuestionScores = await db
      .select()
      .from(questionScores)
      .where(eq(questionScores.sessionId, sessionId));

    const adminReq = req as AdminAuthRequest;
    await logAdminAction({
      adminId: adminReq.admin!.id,
      role: adminReq.admin!.role,
      action: "view_session",
      target: `session:${sessionId}`,
      requestId: (req as any).requestId,
      ip: req.ip,
    });

    res.json({
      success: true,
      session: sessionData,
      candidate: candidate || null,
      report: activeReport ? {
        ...activeReport,
        recruiterNotes: "Candidate showcase completed. All evaluations serve solely as structured notes for human recruiters and panel interviewers.",
        recommendation: "Human Review Pending",
      } : null,
      questionScores: sessionQuestionScores,
      signals: [], // Proctoring telemetry completely deleted
      transcript,
    });
  } catch (e) {
    console.error("admin/sessions/:id error:", e);
    res.status(500).json({ error: "Failed to fetch session details." });
  }
});

// ─── GET /api/admin/reports ───────────────────────────────────────────────────
// Minimum role: viewer
router.get("/reports", async (req, res) => {
  try {
    const allReports = await db
      .select({
        id: interviewReports.id,
        sessionId: interviewReports.sessionId,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        overallScore: interviewReports.overallScore,
        recommendation: interviewReports.recommendation,
        rubricVersion: interviewReports.rubricVersion,
        generatedAt: interviewReports.generatedAt,
      })
      .from(interviewReports)
      .leftJoin(sessions, eq(interviewReports.sessionId, sessions.id))
      .leftJoin(candidates, eq(sessions.candidateId, candidates.id))
      .orderBy(desc(interviewReports.generatedAt));

    res.json({ success: true, reports: allReports });
  } catch (e) {
    console.error("admin/reports error:", e);
    res.status(500).json({ error: "Failed to fetch reports." });
  }
});

// ─── GET /api/admin/flags ─────────────────────────────────────────────────────
// Human recruiter review queue (sessions manually flagged for panel review)
// Minimum role: viewer
router.get("/flags", async (req, res) => {
  try {
    // Fetch sessions flagged by human reviewers
    const flaggedSessions = await db
      .select({
        sessionId: sessions.id,
        flagReason: sessions.flagReason,
        flaggedAt: sessions.createdAt,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        sessionStatus: sessions.status,
        sessionFlagged: sessions.flagged,
        currentStage: sessions.currentStage,
      })
      .from(sessions)
      .leftJoin(candidates, eq(sessions.candidateId, candidates.id))
      .where(eq(sessions.flagged, true))
      .orderBy(desc(sessions.createdAt));

    res.json({ success: true, flags: flaggedSessions });
  } catch (e) {
    console.error("admin/flags error:", e);
    res.status(500).json({ error: "Failed to fetch flag queue." });
  }
});

// ─── POST /api/admin/sessions/:id/flag ───────────────────────────────────────
// Minimum role: reviewer (admin + reviewer can flag; viewer cannot)
router.post("/sessions/:id/flag", requireRole("admin", "reviewer") as any, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { flagged, flagReason } = req.body;

    if (typeof flagged !== "boolean") {
      return res.status(400).json({ error: "Missing required field: flagged (boolean)." });
    }

    await db
      .update(sessions)
      .set({ flagged, flagReason: flagReason || null })
      .where(eq(sessions.id, sessionId));

    const adminReq = req as AdminAuthRequest;
    await logAdminAction({
      adminId: adminReq.admin!.id,
      role: adminReq.admin!.role,
      action: "update_flag",
      target: `session:${sessionId}`,
      metadata: { flagged, flagReason },
      requestId: (req as any).requestId,
      ip: req.ip,
    });

    res.json({ success: true });
  } catch (e) {
    console.error("admin/sessions/:id/flag error:", e);
    res.status(500).json({ error: "Failed to update flag." });
  }
});

// ─── POST /api/admin/sessions/:id/status ─────────────────────────────────────
// Minimum role: reviewer
router.post("/sessions/:id/status", requireRole("admin", "reviewer") as any, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { status } = req.body;

    const validStatuses = ["active", "completed", "cancelled", "archived"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}.`,
      });
    }

    await db.update(sessions).set({ status }).where(eq(sessions.id, sessionId));

    const adminReq = req as AdminAuthRequest;
    await logAdminAction({
      adminId: adminReq.admin!.id,
      role: adminReq.admin!.role,
      action: "update_status",
      target: `session:${sessionId}`,
      metadata: { status },
      requestId: (req as any).requestId,
      ip: req.ip,
    });

    res.json({ success: true });
  } catch (e) {
    console.error("admin/sessions/:id/status error:", e);
    res.status(500).json({ error: "Failed to update status." });
  }
});

export default router;
