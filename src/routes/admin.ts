import { Router } from "express";
import { db } from "../db/index";
import { candidates, sessions, interviewReports, integritySignals, adminLogs, interviewQuestions, interviewResponses } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { authAdmin, AdminAuthRequest } from "../middleware/admin";
import { logAdminAction } from "../services/adminLogService";
import crypto from "crypto";

const router = Router();

// Protect all /api/admin routes
router.use(requireAuth);
router.use(authAdmin as any);

// Check role / identity
router.get("/me", async (req: AuthRequest, res) => {
  const adminReq = req as AdminAuthRequest;
  res.json({
    success: true,
    admin: adminReq.admin,
    user: req.user
  });
});

// GET /api/admin/candidates
router.get("/candidates", async (req, res) => {
  try {
    const allCandidates = await db.select().from(candidates).orderBy(desc(candidates.createdAt));
    res.json({ success: true, candidates: allCandidates });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

// GET /api/admin/sessions
router.get("/sessions", async (req, res) => {
  try {
    const allSessions = await db.select({
      id: sessions.id,
      candidateId: sessions.candidateId,
      currentStage: sessions.currentStage,
      status: sessions.status,
      flagged: sessions.flagged,
      createdAt: sessions.createdAt
    }).from(sessions).orderBy(desc(sessions.createdAt));
    res.json({ success: true, sessions: allSessions });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// GET /api/admin/sessions/:id
router.get("/sessions/:id", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const sessionData = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
      with: {
        candidate: true
      }
    });
    
    if (!sessionData) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    // Also fetch reports, signals, Q&A
    const reports = await db.query.interviewReports.findMany({ where: eq(interviewReports.sessionId, sessionId) });
    const signals = await db.query.integritySignals.findMany({ where: eq(integritySignals.sessionId, sessionId) });
    
    // Simplified Q&A join
    const qs = await db.select({
      question: interviewQuestions.questionText,
      roundType: interviewQuestions.roundType,
      response: interviewResponses.responseText,
      timeTakenMs: interviewResponses.timeTakenMs
    })
    .from(interviewQuestions)
    .leftJoin(interviewResponses, eq(interviewQuestions.id, interviewResponses.questionId))
    .where(eq(interviewQuestions.sessionId, sessionId));

    const adminReq = req as AdminAuthRequest;
    await logAdminAction(adminReq.admin!.id, "view_session", `session:${sessionId}`);

    res.json({
      success: true,
      session: sessionData,
      report: reports[0] || null,
      signals,
      transcript: qs
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch session details" });
  }
});

// GET /api/admin/reports
router.get("/reports", async (req, res) => {
  try {
    const allReports = await db.select().from(interviewReports).orderBy(desc(interviewReports.generatedAt));
    res.json({ success: true, reports: allReports });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// POST /api/admin/sessions/:id/flag
router.post("/sessions/:id/flag", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { flagged, flagReason } = req.body;
    
    // Only admins or reviewers can do this, but they are protected by middleware
    
    await db.update(sessions)
      .set({ flagged, flagReason, updatedAt: sql`NOW()` })
      .where(eq(sessions.id, sessionId));
      
    const adminReq = req as AdminAuthRequest;
    await logAdminAction(adminReq.admin!.id, "update_flag", `session:${sessionId}`, { flagged, flagReason });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update flag" });
  }
});

// POST /api/admin/sessions/:id/status
router.post("/sessions/:id/status", async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { status } = req.body; // e.g. "active", "completed", "archived"
    
    await db.update(sessions)
      .set({ status, updatedAt: sql`NOW()` })
      .where(eq(sessions.id, sessionId));
      
    const adminReq = req as AdminAuthRequest;
    await logAdminAction(adminReq.admin!.id, "update_status", `session:${sessionId}`, { status });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;
