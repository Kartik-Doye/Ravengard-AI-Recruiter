import { Router, Request, Response } from "express";
import crypto from "crypto";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index";
import {
  candidates,
  sessions,
  resumeAnalyses,
  interviewSessions,
  interviewQuestions,
  interviewResponses,
  integritySignals,
  interviewReports,
  questionScores,
} from "../db/schema";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { signCandidateProfileJwt } from "../services/magicTokenService";
import { evaluateAndScoreSession } from "../services/scoringService";
import { AntiCheatService } from "../services/antiCheatService";

export const candidateInterviewRoutes = Router();

// ============================================================================
// 1. CANDIDATE ONBOARDING & REGISTRATION
// ============================================================================

candidateInterviewRoutes.post(["/register", "/candidate/register", "/candidates/register"], async (req: Request, res: Response) => {
  try {
    const { name, email, role, experience, resumeText, phone } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        errors: ["Name and email are required for candidate registration."]
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const candidateId = `cand-${crypto.createHash("md5").update(normalizedEmail).digest("hex").slice(0, 16)}`;

    // Upsert candidate
    let [candidateRecord] = await db.select().from(candidates).where(eq(candidates.email, normalizedEmail)).limit(1);
    if (!candidateRecord) {
      [candidateRecord] = await db.insert(candidates).values({
        id: candidateId,
        name: String(name).trim(),
        email: normalizedEmail,
        mobile: phone || null,
        organizationId: "org-ravengard-default"
      }).returning();
    }

    // Active session
    let [activeSession] = await db.select().from(sessions)
      .where(eq(sessions.candidateId, candidateRecord.id))
      .orderBy(desc(sessions.createdAt))
      .limit(1);

    if (!activeSession) {
      const sessionId = crypto.randomUUID();
      [activeSession] = await db.insert(sessions).values({
        id: sessionId,
        candidateId: candidateRecord.id,
        currentStage: "resume_upload",
        locked: true,
        status: "active"
      }).returning();
    }

    if (resumeText && typeof resumeText === "string" && resumeText.trim().length > 10) {
      try {
        await db.insert(resumeAnalyses).values({
          id: crypto.randomUUID(),
          sessionId: activeSession.id,
          rawResumeText: resumeText.trim()
        });
      } catch {
        // Non-fatal
      }
    }

    const token = signCandidateProfileJwt({
      id: candidateRecord.id,
      email: candidateRecord.email,
      name: candidateRecord.name,
    });

    return res.json({
      success: true,
      token,
      candidateId: candidateRecord.id,
      candidate: candidateRecord,
      sessionId: activeSession.id,
      session: activeSession,
      registrationStatus: "validated",
      welcomeMessage: "Welcome to RavenGard Assessment Portal!"
    });
  } catch (err: any) {
    console.error("[CandidateInterviewRoutes] Registration error:", err);
    return res.status(500).json({ success: false, errors: [err.message || "Registration failed."] });
  }
});

candidateInterviewRoutes.get("/welcome-message", requireAuth, async (_req: Request, res: Response) => {
  return res.json({ success: true, message: "Welcome to the interview process! Please proceed." });
});

// ============================================================================
// 2. POLICY CONSENT
// ============================================================================

candidateInterviewRoutes.post(["/policy-consent", "/session/confirm-consent"], requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const candidateId = authReq.user?.id;
    if (!candidateId) return res.status(401).json({ error: "Unauthorized" });

    let [session] = await db.select().from(sessions)
      .where(eq(sessions.candidateId, candidateId))
      .orderBy(desc(sessions.createdAt))
      .limit(1);

    if (!session) {
      [session] = await db.insert(sessions).values({
        id: crypto.randomUUID(),
        candidateId,
        currentStage: "resume_upload",
        status: "active",
        locked: true
      }).returning();
    } else {
      [session] = await db.update(sessions).set({
        locked: true,
        currentStage: "resume_upload",
        updatedAt: new Date()
      }).where(eq(sessions.id, session.id)).returning();
    }

    return res.json({ success: true, session });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to confirm consent" });
  }
});

// ============================================================================
// 3. HARDWARE & DEVICE CHECK
// ============================================================================

candidateInterviewRoutes.get("/device-check/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const candidateId = authReq.user?.id;
    if (!candidateId) return res.status(401).json({ error: "Unauthorized" });

    const [session] = await db.select().from(sessions)
      .where(eq(sessions.candidateId, candidateId))
      .orderBy(desc(sessions.createdAt))
      .limit(1);

    return res.json({
      success: true,
      ready: session?.deviceCheckStatus === "passed",
      deviceCheckStatus: session?.deviceCheckStatus || "pending"
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

candidateInterviewRoutes.post("/device-check/save", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId, status, camera, mic, speaker, browser, meta } = req.body || {};
    if (sessionId) {
      await db.update(sessions).set({
        deviceCheckStatus: status || "passed",
        cameraPermission: camera || "granted",
        microphonePermission: mic || "granted",
        speakerTestPassed: Boolean(speaker),
        browserSupported: Boolean(browser),
        deviceCheckCompletedAt: new Date(),
        deviceCheckMeta: meta || {}
      }).where(eq(sessions.id, sessionId));
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

candidateInterviewRoutes.post("/device-check/validate", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body || {};
    if (sessionId) {
      await db.update(sessions).set({
        deviceCheckStatus: "passed",
        deviceCheckCompletedAt: new Date(),
      }).where(eq(sessions.id, sessionId));
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 4. SESSION RETRIEVAL & STAGE LIFECYCLE
// ============================================================================

candidateInterviewRoutes.get("/session/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    return res.json({
      success: true,
      sessionId,
      session: session || null,
      status: session ? session.status : "unknown"
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

candidateInterviewRoutes.post("/session/:id/stage", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const targetStage = req.body?.toStage || req.body?.stage;
    if (!targetStage) {
      return res.status(400).json({ error: "Missing toStage parameter." });
    }

    const [updated] = await db.update(sessions)
      .set({ currentStage: targetStage as any, updatedAt: new Date() })
      .where(eq(sessions.id, sessionId))
      .returning();

    return res.json({ success: true, session: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. LIVE INTERVIEW EXECUTION & STREAMING
// ============================================================================

candidateInterviewRoutes.post("/interview/:id/start", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    let [interviewSession] = await db.select().from(interviewSessions)
      .where(eq(interviewSessions.sessionId, sessionId))
      .orderBy(desc(interviewSessions.startedAt))
      .limit(1);

    if (!interviewSession || interviewSession.status === "completed") {
      [interviewSession] = await db.insert(interviewSessions).values({
        id: crypto.randomUUID(),
        sessionId,
        roundType: "technical",
      }).returning();
    }

    return res.json({ success: true, interviewSession });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

candidateInterviewRoutes.post(["/interview/:id/answer", "/interview/response"], requireAuth, async (req: Request, res: Response) => {
  try {
    const { questionId, responseText } = req.body || {};
    if (!questionId || !responseText) {
      return res.status(400).json({ error: "questionId and responseText are required." });
    }

    // Ensure referenced question exists in interviewQuestions to satisfy foreign key constraint
    const [existingQ] = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, questionId)).limit(1);
    if (!existingQ) {
      await db.insert(interviewQuestions).values({
        id: questionId,
        questionIndex: 1,
        questionText: "Assessment question",
        generatedAt: new Date()
      }).onConflictDoNothing();
    }

    const [resp] = await db.insert(interviewResponses).values({
      id: crypto.randomUUID(),
      questionId,
      responseText
    }).returning();

    return res.json({ success: true, response: resp });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

candidateInterviewRoutes.post("/interview/:id/signal", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const { signalType, metadata, interviewSessionId } = req.body || {};
    if (!signalType) return res.status(400).json({ error: "Missing signalType" });

    const signalId = crypto.randomUUID();
    await db.insert(integritySignals).values({
      id: signalId,
      sessionId,
      interviewSessionId: interviewSessionId || null,
      signalType,
      metadata: JSON.stringify(metadata || {})
    });

    const evaluation = AntiCheatService.evaluateSignal({
      sessionId,
      interviewSessionId,
      signalType,
      metadata: typeof metadata === "object" ? metadata : { raw: metadata }
    });

    return res.json({
      success: true,
      signalId,
      evaluation
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 6. SCORECARD & FINAL REPORT
// ============================================================================

candidateInterviewRoutes.post("/interview/:id/generate-report", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const [existingReport] = await db.select().from(interviewReports).where(eq(interviewReports.sessionId, sessionId));
    if (existingReport) {
      return res.json({ success: true, report: existingReport });
    }

    const scorecard = await evaluateAndScoreSession(sessionId, {
      rubricVersion: (req.body?.rubricVersion as string) || "v1.0",
    });

    return res.json({ success: true, report: scorecard });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

candidateInterviewRoutes.get("/interview/:id/scores", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const scores = await db.select().from(questionScores).where(eq(questionScores.sessionId, sessionId));
    return res.json({ success: true, scores });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

candidateInterviewRoutes.get("/interview/:id/report", requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.id;
    const [report] = await db.select().from(interviewReports).where(eq(interviewReports.sessionId, sessionId));
    if (!report) return res.status(404).json({ error: "Report not found" });
    return res.json({ success: true, report });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

candidateInterviewRoutes.get("/scorecard/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const [report] = await db.select().from(interviewReports).where(eq(interviewReports.sessionId, sessionId)).limit(1);
    if (!report) {
      return res.status(404).json({ error: "Scorecard not found" });
    }
    return res.json({ success: true, scorecard: report, report });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default candidateInterviewRoutes;
