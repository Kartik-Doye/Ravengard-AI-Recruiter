import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { db } from "./src/db/index.ts";
import { candidates, sessions, resumeAnalyses, retakeRequests, integrityEvents, auditLogs } from "./src/db/schema.ts";
import { eq, and, or, desc, lt } from "drizzle-orm";
import multer from "multer";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import { validateRegistration, analyzeResume, generateWelcomeChecklist, validatePolicyConsent, generateInstructionsResponse, validateDeviceCheck, confirmReadiness } from "./src/lib/ai.ts";
import { sendWelcomeEmail } from "./src/lib/email.ts";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { parse } from "url";
import crypto from "crypto";
import { registrationSchema } from "./src/lib/validation.ts";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const [candidate] = await db.select().from(candidates).where(eq(candidates.uid, uid));
      if (!candidate) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      const [activeSession] = await db.select().from(sessions)
        .where(eq(sessions.candidateId, candidate.id))
        .orderBy(desc(sessions.startedAt))
        .limit(1);

      let resumeText = null;
      if (activeSession && activeSession.currentStage === 'dashboard') {
        const [analysis] = await db.select().from(resumeAnalyses).where(eq(resumeAnalyses.sessionId, activeSession.id));
        if (analysis) {
          resumeText = analysis.rawText;
        }
      }

      res.json({ candidate, activeSession, resumeText });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error", details: String(error) });
    }
  });

  app.post("/api/register", requireAuth, async (req: AuthRequest, res) => {
    const correlationId = crypto.randomUUID();
    const uid = req.user!.uid;

    try {
      await db.insert(auditLogs).values({
        eventType: 'registration_submitted',
        correlationId,
        details: { uid, body: req.body }
      });

      const email = req.user!.email || req.body.email || '';
      const bodyWithEmail = { ...req.body, email };
      
      const parsedData = registrationSchema.safeParse(bodyWithEmail);
      if (!parsedData.success) {
        const errors = parsedData.error.errors.map(e => e.message);
        await db.insert(auditLogs).values({
          eventType: 'registration_rejected',
          correlationId,
          details: { uid, reason: 'schema_validation_failed', errors }
        });
        return res.status(400).json({ success: false, errors });
      }

      const { name, mobile, college, degree, gradYear, preferredLanguage } = parsedData.data;

      const existingCandidate = await db.select().from(candidates).where(
        or(
          eq(candidates.uid, uid),
          eq(candidates.email, email),
          eq(candidates.mobile, mobile)
        )
      ).limit(1);

      if (existingCandidate.length > 0) {
        await db.insert(auditLogs).values({
          eventType: 'registration_rejected',
          correlationId,
          details: { uid, reason: 'duplicate_candidate' }
        });
        return res.status(400).json({ success: false, errors: ['Candidate is already registered with this account, email, or mobile number.'] });
      }

      const aiValidation = await validateRegistration({ name, mobile, email, college, degree, gradYear, language: preferredLanguage });
      
      if (!aiValidation.valid) {
        await db.insert(auditLogs).values({
          eventType: 'ai_validation_failed',
          correlationId,
          details: { uid, errors: aiValidation.errors }
        });
        return res.status(400).json({ success: false, errors: aiValidation.errors });
      }

      const [candidate] = await db.insert(candidates).values({
        uid,
        name,
        mobile,
        email,
        college,
        degree,
        gradYear,
        preferredLanguage,
      }).returning();

      await db.insert(auditLogs).values({
        eventType: 'registration_validated',
        correlationId,
        details: { uid, candidateId: candidate.id }
      });

      // Send welcome email asynchronously
      if (email) {
        sendWelcomeEmail(email, name).catch(console.error);
      }

      res.json({ candidateId: candidate.id, registrationStatus: 'validated', welcomeMessage: aiValidation.welcomeMessage });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, errors: ["Registration failed due to a server error."] });
    }
  });

  
  app.get("/api/welcome-message", requireAuth, async (req: AuthRequest, res) => {
    const correlationId = crypto.randomUUID();
    const uid = req.user!.uid;

    try {
      const [candidate] = await db.select().from(candidates).where(eq(candidates.uid, uid));
      if (!candidate) {
        return res.status(404).json({ success: false, error: "Candidate not found" });
      }
      
      const aiResponse = await generateWelcomeChecklist(candidate);
      
      if (!aiResponse) {
        await db.insert(auditLogs).values({
          eventType: 'welcome_failed',
          correlationId,
          details: { uid, candidateId: candidate.id }
        });
        return res.json({ 
          success: true,
          message: "Welcome to Traineer! We'll guide you through this sequential interview process. It should take about 60-90 minutes. Up next: Policy Consent.",
          checklist: ["Camera and Microphone required", "Find a quiet space"]
        });
      }

      await db.insert(auditLogs).values({
        eventType: 'welcome_generated',
        correlationId,
        details: { uid, candidateId: candidate.id }
      });

      res.json({ success: true, ...aiResponse });
    } catch (e) {
      console.error(e);
      await db.insert(auditLogs).values({
        eventType: 'welcome_failed',
        correlationId,
        details: { uid, error: String(e) }
      });
      res.json({ 
        success: true,
        message: "Welcome to Traineer! We'll guide you through this sequential interview process. It should take about 60-90 minutes. Up next: Policy Consent.",
        checklist: ["Camera and Microphone required", "Find a quiet space"]
      });
    }
  });

  app.post("/api/session/start", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { candidateId } = req.body;

      // Ensure idempotency by returning an existing active session if one exists
      const [existingSession] = await db.select().from(sessions)
        .where(
          and(
            eq(sessions.candidateId, candidateId),
            eq(sessions.locked, true)
          )
        )
        .orderBy(desc(sessions.startedAt))
        .limit(1);

      if (existingSession && (existingSession.status === 'created' || existingSession.status === 'in_progress')) {
        return res.json(existingSession);
      }

      const [newSession] = await db.insert(sessions).values({
        candidateId, companyId: 1, configSnapshot: {},
        locked: true,
        consentAcceptedAt: null,
        currentStage: 'consent',
        status: 'created'
      }).returning();

      res.json(newSession);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to start session", details: String(error) });
    }
  });

  
  app.post("/api/session/:id/policy-confirm", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { text } = req.body;
      const response = await validatePolicyConsent(text);
      res.json({ response });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to confirm policy" });
    }
  });

  
  app.post("/api/interview/instructions/confirm", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { text } = req.body;
      const [candidate] = await db.select().from(candidates).where(eq(candidates.uid, req.user!.uid));
      if (!candidate) return res.status(404).json({ error: "Candidate not found" });

      const response = await generateInstructionsResponse(candidate, text);
      res.json({ response });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to confirm instructions" });
    }
  });

  app.post("/api/device-check/validate", requireAuth, async (req: AuthRequest, res) => {
    try {
      const results = req.body;
      const response = await validateDeviceCheck(results);
      res.json(response);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to validate device check" });
    }
  });

  app.post("/api/interview/readiness/confirm", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { text, sessionId } = req.body;
      const [candidate] = await db.select().from(candidates).where(eq(candidates.uid, req.user!.uid));
      if (!candidate) return res.status(404).json({ error: "Candidate not found" });

      const response = await confirmReadiness(candidate.name, sessionId.toString(), text);
      res.json({ response });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to confirm readiness" });
    }
  });

  app.post("/api/session/:id/stage", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { stage, version } = req.body;
      
      const [currentSession] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!currentSession) {
         return res.status(404).json({ error: "Session not found" });
      }
      
      if (version !== undefined && currentSession.version !== version) {
         return res.status(409).json({ error: "Conflict: Session state changed", session: currentSession });
      }

      const updateData: any = { currentStage: stage, version: currentSession.version + 1 };
      if (stage === 'resume') {
        updateData.consentAcceptedAt = new Date();
      }

      const [updatedSession] = await db.update(sessions)
        .set(updateData)
        .where(
           and(
             eq(sessions.id, sessionId),
             eq(sessions.version, currentSession.version)
           )
        )
        .returning();

      if (!updatedSession) {
         return res.status(409).json({ error: "Conflict: Could not update session state" });
      }

      res.json(updatedSession);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update session stage", details: String(error) });
    }
  });

  app.post("/api/session/:id/request-retake", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      await db.insert(retakeRequests).values({
        candidateId: session.candidateId,
        status: 'pending',
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to request retake" });
    }
  });

  
  app.get("/api/session/:id/resume-analysis", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const [analysis] = await db.select().from(resumeAnalyses).where(eq(resumeAnalyses.sessionId, sessionId));
      if (!analysis) return res.status(404).json({ error: "Analysis not found" });
      res.json(analysis);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  app.post("/api/session/:id/upload-resume", requireAuth, upload.single('resume'), async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "No resume file provided" });
      }

      let rawText = '';
      if (file.mimetype === 'application/pdf') {
        const pdfDocument = await getDocumentProxy(new Uint8Array(file.buffer));
        const { text } = await extractText(pdfDocument, { mergePages: true });
        rawText = text;
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        rawText = result.value;
      } else {
        return res.status(400).json({ error: "Unsupported file type. Please upload PDF or DOCX." });
      }

      // Phase 1: AI Analysis
      const analysis = await analyzeResume(rawText, "Software Engineer");

      await db.insert(resumeAnalyses).values({
        sessionId,
        rawText,
        skills: analysis.skills,
        projects: analysis.projects,
        experience: analysis.experience,
        education: analysis.education,
        certifications: analysis.certifications,
        atsScore: analysis.atsScore,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missingKeywords: analysis.missingKeywords,
        recruiterReviewText: analysis.recruiterReviewText
      });

      const [updatedSession] = await db.update(sessions)
        .set({ currentStage: 'resume_analysis', status: 'in_progress', resumeUrl: file.originalname })
        .where(eq(sessions.id, sessionId))
        .returning();

      res.json({ session: updatedSession, resumeText: rawText, analysis });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process resume", details: String(error) });
    }
  });

  

  app.post("/api/session/violation", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) return res.status(404).json({ error: "Session not found" });

      const [candidate] = await db.select().from(candidates).where(eq(candidates.uid, req.user!.uid));
      if (!candidate || session.candidateId !== candidate.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await db.insert(integrityEvents).values({
        sessionId,
        type: 'tab_switch_violation',
        severity: 'high',
        evidenceRef: 'visibilitychange'
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Violation log error", error);
      res.status(500).json({ error: "Failed to log violation" });
    }
  });

  app.post("/api/session/:id/think-again", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) return res.status(404).json({ error: "Session not found" });

      if (session.thinkAgainUsed >= 2) {
        return res.status(400).json({ error: "No think-agains left" });
      }

      await db.update(sessions)
        .set({ thinkAgainUsed: session.thinkAgainUsed + 1 })
        .where(eq(sessions.id, sessionId));

      res.json({ success: true, thinkAgainUsed: session.thinkAgainUsed + 1 });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to process think again" });
    }
  });

  app.post("/api/session/:id/violation", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { type, severity, evidenceRef } = req.body;
      
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      await db.insert(integrityEvents).values({
        sessionId,
        type: type || 'tab_switch',
        severity: severity || 'low',
        evidenceRef: evidenceRef || ''
      });

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to record violation" });
    }
  });

  app.post("/api/session/:id/schedule", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);

      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ success: true, resources: { meetLink: "Internal Environment", sheetId: "Internal DB" } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to schedule interview", details: String(error) });
    }
  });

  // Admin endpoint for monitoring stuck sessions
  app.get("/api/admin/stuck-sessions", async (req, res) => {
    try {
      // Sessions with status 'in_progress' inactive for > 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const stuckSessions = await db.select().from(sessions)
        .where(
          and(
            eq(sessions.status, 'in_progress'),
            lt(sessions.lastActiveAt, twoHoursAgo)
          )
        );
      res.json({ count: stuckSessions.length, sessions: stuckSessions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to query stuck sessions" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Background job to clean up abandoned sessions
  // Runs every hour to check for sessions idle for > 24 hours
  setInterval(async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const result = await db.update(sessions)
        .set({ status: 'abandoned' })
        .where(
          and(
            eq(sessions.status, 'in_progress'),
            lt(sessions.lastActiveAt, oneDayAgo)
          )
        );
      
      // Note: db.update result behavior varies by database, but we just log success.
      console.log(`Cron: Checked for abandoned sessions.`);
    } catch (error) {
      console.error('Error in abandoned sessions cron job:', error);
    }
  }, 60 * 60 * 1000); // 1 hour

  // Background job to monitor API costs
  // Runs daily to alert if LLM API spend is climbing unexpectedly (Stub)
  setInterval(() => {
     console.log(`Cron: Checking cumulative LLM API spend against threshold...`);
     // Implementation would integrate with the chosen LLM provider's billing API
     // and send an alert email via sendWelcomeEmail or similar utility if thresholds exceed limits.
  }, 24 * 60 * 60 * 1000); // 24 hours

  app.get("/api/admin/retake-requests", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.admin) return res.status(403).json({ error: "Forbidden" });
      const requests = await db.select().from(retakeRequests).where(eq(retakeRequests.status, 'pending'));
      res.json(requests);
    } catch (e) { res.status(500).json({ error: "Failed to fetch retake requests" }); }
  });

  app.post("/api/admin/retake-requests/:id/approve", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.admin) return res.status(403).json({ error: "Forbidden" });
      const requestId = parseInt(req.params.id);
      
      const [request] = await db.select().from(retakeRequests).where(eq(retakeRequests.id, requestId));
      if (!request) return res.status(404).json({ error: "Not found" });

      // Approve retake request - create a new session
      const [newSession] = await db.insert(sessions).values({
        candidateId: request.candidateId, companyId: 1, configSnapshot: {},
        locked: true,
        consentAcceptedAt: null,
        currentStage: 'consent',
        status: 'created',
        version: 1
      }).returning();

      await db.update(retakeRequests).set({
        status: 'approved',
        reviewedBy: req.user!.uid,
        reviewedAt: new Date()
      }).where(eq(retakeRequests.id, requestId));

      res.json({ success: true, newSession });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to approve retake request" });
    }
  });

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  
  const wss = new WebSocketServer({ noServer: true });

  (server as any).on('upgrade', async (request, socket, head) => {
    const { pathname, query } = parse(request.url || '', true);
    if (pathname === '/api/live') {
      try {
        const token = query.token as string;
        const sessionIdStr = query.sessionId as string;
        
        if (!token || !sessionIdStr) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
        
        // Simple token verification
        const [candidate] = await db.select().from(candidates).where(eq(candidates.uid, token));
        if (!candidate) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        const sessionId = parseInt(sessionIdStr);
        const [sessionRow] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
        
        if (!sessionRow || sessionRow.candidateId !== candidate.id) {
          socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
          socket.destroy();
          return;
        }
        
        // Fetch resume analysis for context
        const [resumeAnalysis] = await db.select().from(resumeAnalyses).where(eq(resumeAnalyses.sessionId, sessionId));

        (request as any).context = { candidate, session: sessionRow, resumeAnalysis };

        wss.handleUpgrade(request, socket as any, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } catch (err) {
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
      }
    }
  });

  wss.on("connection", async (clientWs, request) => {
    try {
      const { candidate, session, resumeAnalysis } = (request as any).context;
      
      const candidateContext = resumeAnalysis 
        ? `Candidate Name: ${candidate.name}. Skills: ${resumeAnalysis.skills?.join(', ')}. Strengths: ${resumeAnalysis.strengths?.join(', ')}. Job Role specific gaps to watch for: ${resumeAnalysis.missingKeywords?.join(', ')}.` 
        : `Candidate Name: ${candidate.name}`;

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      const liveSession = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          systemInstruction: `You are the 'Friendly HR' AI interviewer for Traineer. 
          Your goal is to greet the candidate, break the ice, introduce yourself, and test their communication style. 
          
          Candidate Context: ${candidateContext}
          
          Rules:
          - Ask one question at a time. 
          - Be warm, low-pressure, and conversational. 
          - Do NOT reveal live scores, pass/fail status. 
          - Limit this round to 4-6 turns. 
          - If the candidate stops speaking, gently prompt them to continue or move to the next question.
          - Never fabricate claims about the candidate.`,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.text) {
            liveSession.sendClientContent({ turns: [{ role: 'user', parts: [{ text: parsed.text }] }] });
          } else if (parsed.audio) {
            liveSession.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch(e) { console.error("WS msg parse error", e); }
      });

      clientWs.on("close", () => {
        try { liveSession.close(); } catch(e) {}
      });
    } catch(e) {
      console.error("Live API connection error:", e);
      if (clientWs.readyState === 1) clientWs.close();
    }
  });
}

startServer();
