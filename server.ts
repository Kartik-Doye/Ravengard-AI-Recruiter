import express from "express";
import { extractTextFromFile, analyzeResumeWithAI } from "./src/services/resume-processor";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth";
import { db } from "./src/db/index";
import { candidates, sessions, resumeAnalyses, organizationAdmins, sessionViolations, roundOutputs, assessments, assessmentRecommendations, contacts } from "./src/db/schema";
import { eq, and, or, desc, lt } from "drizzle-orm";
import multer from "multer";

import { validateRegistration, analyzeResume, generateWelcomeChecklist, validatePolicyConsent, generateInstructionsResponse, validateDeviceCheck, confirmReadiness } from "./src/lib/ai";
import { sendWelcomeEmail } from "./src/lib/email";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { parse } from "url";
import crypto from "crypto";
import fs from "fs/promises";
import { registrationSchema } from "./src/lib/validation";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const email = req.user!.email;
      const [user] = await db.select().from(candidates).where(eq(candidates.email, email));
      if (!user) {
        return res.status(404).json({ error: "Candidate not found" });
      }
      
      const [activeSession] = await db.select().from(sessions)
        .where(eq(sessions.candidateId, user.id))
        .orderBy(desc(sessions.createdAt))
        .limit(1);

      let resumeText = null;
      if (activeSession && activeSession.currentStage === 'completed') {
        const [analysis] = await db.select().from(resumeAnalyses).where(eq(resumeAnalyses.sessionId, activeSession.id));
        if (analysis) {
          resumeText = analysis.rawResumeText;
        }
      }

      res.json({ user, activeSession, resumeText });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error", details: String(error) });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await db.insert(contacts).values({
        id: crypto.randomUUID(),
        name,
        email,
        message,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  });

  app.post("/api/register", requireAuth, async (req: AuthRequest, res) => {
    const correlationId = crypto.randomUUID();
    const email = req.user!.email;

    try {

      const email = req.user!.email || req.body.email || '';
      const bodyWithEmail = { ...req.body, email };
      
      const parsedData = registrationSchema.safeParse(bodyWithEmail);
      if (!parsedData.success) {
        const errors = parsedData.error.issues.map(e => e.message);
        return res.status(400).json({ success: false, errors });
      }

      const { email: reqEmail, gradYear } = parsedData.data;

      const existingCandidate = await db.select().from(candidates).where(
        or(
          eq(candidates.email, email),
          eq(candidates.email, reqEmail),
          eq(candidates. email || '')
        )
      ).limit(1);

      if (existingCandidate.length > 0) {
        return res.status(400).json({ success: false, errors: ['Candidate is already registered with this account, email, or email number.'] });
      }

      const aiValidation = await validateRegistration({ name: req.user!.email, email: email || '', college: '', degree: '', gradYear: gradYear || 0, language: '' });
      
      if (!aiValidation.valid) {
        return res.status(400).json({ success: false, errors: aiValidation.errors });
      }

      const [user] = await db.insert(candidates).values({
        email,
        gradYear,
      }).returning();

      // Send welcome email asynchronously
      if (email) {
        sendWelcomeEmail(email, "Candidate").catch(console.error);
      }

      res.json({ candidateId: user.id, registrationStatus: 'validated', welcomeMessage: aiValidation.welcomeMessage });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, errors: ["Registration failed due to a server error."] });
    }
  });

  
  app.get("/api/welcome-message", requireAuth, async (req: AuthRequest, res) => {
    const correlationId = crypto.randomUUID();
    const email = req.user!.email;

    try {
      const [user] = await db.select().from(candidates).where(eq(candidates.email, email));
      if (!user) {
        return res.status(404).json({ success: false, error: "Candidate not found" });
      }
      
      const aiResponse = await generateWelcomeChecklist(user);
      
      if (!aiResponse) {
        return res.json({ 
          success: true,
          message: "Welcome to Ravengard AI Recruiter! We'll gemaile you through this sequential interview process. It should take about 60-90 minutes. Up next: Policy Consent.",
          checklist: ["Camera and Microemail required", "Find a quiet space"]
        });
      }


      res.json({ success: true, ...aiResponse });
    } catch (e) {
      console.error(e);
      res.json({ 
        success: true,
        message: "Welcome to Ravengard AI Recruiter! We'll gemaile you through this sequential interview process. It should take about 60-90 minutes. Up next: Policy Consent.",
        checklist: ["Camera and Microemail required", "Find a quiet space"]
      });
    }
  });

  
  app.post("/api/session/confirm-consent", requireAuth, async (req: AuthRequest, res) => {
    try {
      const email = req.user!.email;
      const { text, policyVersion } = req.body;
      
      if (text !== "I Agree") {
        return res.status(400).json({ success: false, error: "Exact text 'I Agree' is required." });
      }

      const [candidate] = await db.select().from(candidates).where(eq(candidates.email, email));
      if (!candidate) {
        return res.status(404).json({ success: false, error: "Candidate not found" });
      }

      // Ensure idempotency: if there's already an active session, just return it.
      const [existingSession] = await db.select().from(sessions)
        .where(and(
            eq(sessions.candidateId, candidate.id),
            eq(sessions.locked, true),
            or(eq(sessions.status, 'active'), eq(sessions.status, 'in_progress'))
        ))
        .orderBy(desc(sessions.createdAt))
        .limit(1);

      if (existingSession) {
         return res.json({ success: true, session: existingSession });
      }

      // Create the locked session
      const sessionId = crypto.randomUUID();
      const activePolicyVersion = policyVersion || "v1.0";
      
      const [newSession] = await db.insert(sessions).values({
        id: sessionId,
        candidateId: candidate.id,
        locked: true,
        consentAcceptedAt: new Date(),
        policyVersion: activePolicyVersion,
        currentStage: 'resume_upload',
        status: 'active',
        thinkAgainUsesLeft: 3
      }).returning();

      res.json({ success: true, session: newSession });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: "Failed to confirm policy" });
    }
  });


  app.post("/api/interview/instructions/confirm", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { text } = req.body;
      const [user] = await db.select().from(candidates).where(eq(candidates.email, req.user!.email));
      if (!user) return res.status(404).json({ error: "Candidate not found" });

      const response = await generateInstructionsResponse(user, text);
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
      const [user] = await db.select().from(candidates).where(eq(candidates.email, req.user!.email));
      if (!user) return res.status(404).json({ error: "Candidate not found" });

      const response = await confirmReadiness(user.email, sessionId.toString(), text);
      res.json({ response });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to confirm readiness" });
    }
  });

  app.post("/api/session/:id/stage", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;
      const { stage } = req.body;
      
      const [currentSession] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!currentSession) {
         return res.status(404).json({ error: "Session not found" });
      }
      
      if (version !== undefined && currentSession.version !== version) {
         return res.status(409).json({ error: "Conflict: Session state changed", session: currentSession });
      }

      if (currentSession.locked) {
        const validTransitions: Record<string, string[]> = {
          'welcome': ['consent'],
          'consent': ['resume'],
          'resume': ['resume_analysis', 'consent'],
          'resume_analysis': ['instructions', 'resume'],
          'instructions': ['device_check', 'resume_analysis'],
          'device_check': ['waiting_room', 'instructions'],
          'waiting_room': ['interview_hr_friendly', 'device_check'],
          'interview_hr_friendly': ['completed']
        };
        const allowedNext = validTransitions[currentSession.currentStage] || [];
        if (!allowedNext.includes(stage)) {
          return res.status(400).json({ error: `Invalid phase transition from ${currentSession.currentStage} to ${stage}. Manual phase selection is locked.` });
        }
      }

      const updateData: any = { currentStage: stage,  };

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
      const sessionId = req.params.id;
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to request retake" });
    }
  });

  
  app.get("/api/session/:id/resume-analysis", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;
      const [analysis] = await db.select().from(resumeAnalyses).where(eq(resumeAnalyses.sessionId, sessionId));
      if (!analysis) return res.status(404).json({ error: "Analysis not found" });
      res.json(analysis);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  app.post("/api/session/:id/upload-resume", requireAuth, upload.single('resume'), async (req: AuthRequest, res) => {
    const correlationId = crypto.randomUUID();
    const email = req.user!.email;
    const sessionId = req.params.id;

    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "No resume file provided" });
      }

      // Phase 1.1: Server-side validation
      const header = file.buffer.subarray(0, 4);
      let isValidType = false;
      let detectedType = '';

      // Check magic bytes
      if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
        isValidType = true;
        detectedType = 'pdf';
      } else if (header[0] === 0x50 && header[1] === 0x4B && header[2] === 0x03 && header[3] === 0x04) {
        isValidType = true;
        detectedType = 'docx';
      }

      const originalExt = path.extname(file.originalname).toLowerCase();
      if (!['.pdf', '.docx'].includes(originalExt)) {
         isValidType = false;
      }

      if (!isValidType) {
        return res.status(400).json({ error: "Unsupported or corrupted file. Please upload a valid PDF or DOCX." });
      }

      const fileId = crypto.randomUUID();
      const storageFilename = `${fileId}.${detectedType}`;
      const storagePath = path.join(process.cwd(), 'uploads', storageFilename);

      await fs.writeFile(storagePath, file.buffer);

      let rawResumeText = "";
      try {
        rawResumeText = await extractTextFromFile(file.buffer, detectedType as 'pdf' | 'docx');
      } catch (e) {
        return res.status(400).json({ error: "Failed to extract text from document." });
      }

      // Perform Gemini Analysis via service
      const analysis = await analyzeResumeWithAI(rawResumeText);

      await db.insert(resumeAnalyses).values({
         id: crypto.randomUUID(),
         sessionId: sessionId,
         rawResumeText: rawResumeText,
         skills: analysis.skills,
         strengths: analysis.strengths,
         missingKeywords: analysis.missingKeywords
      });

      const [updatedSession] = await db.update(sessions)
        .set({ currentStage: 'resume_analysis' }) 
        .where(and(eq(sessions.id, sessionId), eq(sessions.locked, true)))
        .returning();

      if (!updatedSession) {
         throw new Error("Failed to update session or session not locked.");
      }


      res.json({ success: true, session: updatedSession, resumeReference: storagePath });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to store resume", details: String(error) });
    }
  });

  

  app.post("/api/session/violation", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) return res.status(404).json({ error: "Session not found" });

      const [user] = await db.select().from(candidates).where(eq(candidates.email, req.user!.email));
      if (!user || session.candidateId !== user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Violation log error", error);
      res.status(500).json({ error: "Failed to log violation" });
    }
  });

  app.post("/api/session/:id/think-again", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) return res.status(404).json({ error: "Session not found" });

      if (session.thinkAgainUsesLeft >= 2) {
        return res.status(400).json({ error: "No think-agains left" });
      }

      await db.update(sessions)
        .set({ thinkAgainUsesLeft: session.thinkAgainUsesLeft + 1 })
        .where(eq(sessions.id, sessionId));

      res.json({ success: true, thinkAgainUsesLeft: session.thinkAgainUsesLeft + 1 });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to process think again" });
    }
  });

  app.post("/api/session/:id/violation", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;
      const { type, severity, evidenceRef } = req.body;
      
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }


      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to record violation" });
    }
  });

  app.post("/api/session/:id/schedule", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;

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
  app.get("/api/admin/stuck-sessions", requireAuth, async (req, res) => {
    // @ts-ignore
    const email = req.user.email;
    const [user] = await db.select().from(candidates).where(eq(candidates.email, email));
    const [admin] = await db.select().from(organizationAdmins).where(eq(organizationAdmins.email, email));
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
      // Sessions with status 'active' inactive for > 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const stuckSessions = await db.select().from(sessions)
        .where(
          and(
            eq(sessions.status, 'active'),
            lt(sessions.updatedAt, twoHoursAgo)
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
        .set({ status: 'cancelled' })
        .where(
          and(
            eq(sessions.status, 'active'),
            lt(sessions.updatedAt, oneDayAgo)
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
        const [user] = await db.select().from(candidates).where(eq(candidates.email, token));
        if (!user) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        const sessionId = sessionIdStr;
        const [sessionRow] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
        
        if (!sessionRow || sessionRow.candidateId !== user.id) {
          socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
          socket.destroy();
          return;
        }
        
        // Fetch resume analysis for context
        const [resumeAnalysis] = await db.select().from(resumeAnalyses).where(eq(resumeAnalyses.sessionId, sessionId));

        (request as any).context = { user, session: sessionRow, resumeAnalysis };

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
      const { user, session, resumeAnalysis } = (request as any).context;
      
      const userContext = resumeAnalysis 
        ? `Candidate Name: ${user.name}. Skills: ${resumeAnalysis.skills?.join(', ')}. Strengths: ${resumeAnalysis.strengths?.join(', ')}. Job Role specific gaps to watch for: ${resumeAnalysis.missingKeywords?.join(', ')}.` 
        : `Candidate Name: ${user.name}`;

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const connectWithRetry = async () => {
        let lastError: any;
        const maxRetries = 5;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 0 && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ type: 'retry_status', attempt, maxAttempts: maxRetries }));
            }
            const liveSession = await ai.live.connect({
              model: "gemini-3.1-flash-live-preview",
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
                },
                systemInstruction: `You are the 'Friendly HR' AI interviewer for Ravengard AI Recruiter. 
                Your goal is to greet the user, break the ice, introduce yourself, and test their communication style. 
                
                Candidate Context: ${userContext}
                
                Rules:
                - Ask one question at a time. 
                - Be warm, low-pressure, and conversational. 
                - Do NOT reveal live scores, pass/fail status. 
                - Limit this round to 4-6 turns. 
                - If the user stops speaking, gently prompt them to continue or move to the next question.
                - Never fabricate claims about the user.`,
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
            if (attempt > 0 && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ type: 'retry_success' }));
            }
            return liveSession;
          } catch (err: any) {
            lastError = err;
            const status = err?.status || err?.response?.status;
            const code = err?.code || err?.error?.code || err?.message;

            const retryable =
              status === 429 ||
              status === 503 ||
              status === 504 ||
              String(code).includes("RESOURCE_EXHAUSTED");

            if (!retryable || attempt === maxRetries) break;

            const base = 1000;
            const ceiling = Math.min(base * 2 ** attempt, 60000);
            const delay = Math.floor(Math.random() * ceiling);

            await new Promise((r) => setTimeout(r, delay));
          }
        }
        throw lastError;
      };

      const liveSession = await connectWithRetry();

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
    } catch(e: any) {
      console.error("Live API connection error:", e);
      if (clientWs.readyState === 1) {
        if (e.message?.includes('resource_exhausted') || e.message?.includes('429')) {
          clientWs.send(JSON.stringify({ error: "AI quota exceeded. Please try again later." }));
        } else {
          clientWs.send(JSON.stringify({ error: "Failed to connect to AI service." }));
        }
        clientWs.close();
      }
    }
  });
}

startServer();
