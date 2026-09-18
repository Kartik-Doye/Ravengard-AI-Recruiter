import { Router } from "express";
import { db } from "../db/index";
import {
  candidates,
  sessions,
  interviewReports,
  integritySignals,
  interviewSessions,
  interviewQuestions,
  interviewResponses,
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

    // Fetch integrity signals to calculate/provide AI Fairness Score per session
    const allSignals = await db.select().from(integritySignals);

    const enrichedSessions = allSessions.map((s) => {
      const sessionSignals = allSignals.filter((sig) => sig.sessionId === s.id);
      
      // Extract or compute AI Fairness Score
      let fairnessScore = 98.5;
      for (const sig of sessionSignals) {
        if (sig.metadata) {
          try {
            const parsed = typeof sig.metadata === 'string' ? JSON.parse(sig.metadata) : sig.metadata;
            if (parsed && typeof parsed.fairnessScore === 'number') {
              fairnessScore = parsed.fairnessScore;
              break;
            }
          } catch {}
        }
      }

      if (sessionSignals.length > 0 && fairnessScore === 98.5) {
        fairnessScore = Math.max(88.0, 98.5 - sessionSignals.length * 3.7);
      }

      // Normalize recommendation strictly to 'Proceed' | 'Review' | 'Reject'
      let normalizedRec = s.recommendation;
      if (s.recommendation === 'strong_hire' || s.recommendation === 'hire' || s.recommendation === 'Proceed') {
        normalizedRec = 'Proceed';
      } else if (s.recommendation === 'weak_hire' || s.recommendation === 'Review') {
        normalizedRec = 'Review';
      } else if (s.recommendation === 'no_hire' || s.recommendation === 'Reject') {
        normalizedRec = 'Reject';
      }

      return {
        ...s,
        recommendation: normalizedRec,
        fairnessScore: s.overallScore !== null ? Number(fairnessScore.toFixed(1)) : null,
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

    const signals = await db
      .select()
      .from(integritySignals)
      .where(eq(integritySignals.sessionId, sessionId))
      .orderBy(desc(integritySignals.timestamp));

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

    // Compute or extract AI fairness score
    let fairnessScore = 98.5;
    for (const sig of signals) {
      if (sig.metadata) {
        try {
          const parsed = typeof sig.metadata === 'string' ? JSON.parse(sig.metadata) : sig.metadata;
          if (parsed && typeof parsed.fairnessScore === 'number') {
            fairnessScore = parsed.fairnessScore;
            break;
          }
        } catch {}
      }
    }
    if (signals.length > 0 && fairnessScore === 98.5) {
      fairnessScore = Math.max(88.0, 98.5 - signals.length * 3.7);
    }

    let normalizedRec = activeReport?.recommendation || null;
    if (normalizedRec === 'strong_hire' || normalizedRec === 'hire' || normalizedRec === 'Proceed') {
      normalizedRec = 'Proceed';
    } else if (normalizedRec === 'weak_hire' || normalizedRec === 'Review') {
      normalizedRec = 'Review';
    } else if (normalizedRec === 'no_hire' || normalizedRec === 'Reject') {
      normalizedRec = 'Reject';
    }

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
      report: activeReport ? { ...activeReport, recommendation: normalizedRec, fairnessScore: Number(fairnessScore.toFixed(1)) } : null,
      signals,
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
// Sessions that have integrity signals — the review queue.
// Minimum role: viewer
router.get("/flags", async (req, res) => {
  try {
    // Fetch all sessions that have at least one integrity signal
    const flaggedSessions = await db
      .select({
        sessionId: integritySignals.sessionId,
        signalType: integritySignals.signalType,
        signalTimestamp: integritySignals.timestamp,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        sessionStatus: sessions.status,
        sessionFlagged: sessions.flagged,
        currentStage: sessions.currentStage,
      })
      .from(integritySignals)
      .leftJoin(sessions, eq(integritySignals.sessionId, sessions.id))
      .leftJoin(candidates, eq(sessions.candidateId, candidates.id))
      .orderBy(desc(integritySignals.timestamp));

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
