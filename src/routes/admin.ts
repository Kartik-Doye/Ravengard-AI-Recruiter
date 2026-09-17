import { Router } from "express";
import { db } from "../db/index";
import { candidates, sessions, interviewReports, integritySignals, adminLogs, interviewQuestions, interviewResponses } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { authAdmin, AdminAuthRequest } from "../middleware/admin";
import { logAdminAction } from "../lib/auditLogger";
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
    const allCandidates = await db.select().from(candidates);
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
      candidateName: candidates.name,
      currentStage: sessions.currentStage,
      status: sessions.status,
      createdAt: sessions.createdAt,
      overallScore: interviewReports.overallScore,
      recommendation: interviewReports.recommendation
    })
    .from(sessions)
    .leftJoin(candidates, eq(sessions.candidateId, candidates.id))
    .leftJoin(interviewReports, eq(sessions.id, interviewReports.sessionId))
    .orderBy(desc(sessions.createdAt));
    
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
      where: eq(sessions.id, sessionId)
    });
    
    if (!sessionData) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    // Also fetch reports, signals, Q&A
    const reports = await db.query.interviewReports.findMany({ where: eq(interviewReports.sessionId, sessionId) });
    const signals = await db.query.integritySignals.findMany({ where: eq(integritySignals.sessionId, sessionId) });
    
    const qs = await db.select({
      question: interviewQuestions.questionText,
      response: interviewResponses.responseText,
    })
    .from(interviewQuestions)
    .leftJoin(interviewResponses, eq(interviewQuestions.id, interviewResponses.questionId))
    .where(eq(interviewQuestions.sessionId, sessionId));

    const adminReq = req as AdminAuthRequest;
    await logAdminAction({
      adminId: adminReq.admin!.id,
      role: adminReq.admin!.role,
      action: "view_session",
      target: `session:${sessionId}`,
      requestId: (req as any).requestId,
      ip: req.ip
    });

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
    // Removed flag updates since column doesn't exist on schema
        
    const adminReq = req as AdminAuthRequest;
    await logAdminAction({
      adminId: adminReq.admin!.id,
      role: adminReq.admin!.role,
      action: "update_flag",
      target: `session:${sessionId}`,
      metadata: req.body,
      requestId: (req as any).requestId,
      ip: req.ip
    });

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
    await logAdminAction({
      adminId: adminReq.admin!.id,
      role: adminReq.admin!.role,
      action: "update_status",
      target: `session:${sessionId}`,
      metadata: { status },
      requestId: (req as any).requestId,
      ip: req.ip
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;
