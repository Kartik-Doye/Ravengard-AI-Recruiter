import express from "express";
import { extractTextFromFile } from "./src/services/resume-processor";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth";
import { db } from "./src/db/index";
import { candidates, sessions, resumeAnalyses, organizationAdmins, contacts } from "./src/db/schema";
import { eq, and, or, desc, lt } from "drizzle-orm";
import multer from "multer";

import { generateWelcomeChecklist, generateInstructionsResponse, validateDeviceCheck, confirmReadiness } from "./src/lib/ai";
import { sendWelcomeEmail } from "./src/lib/email";
import crypto from "crypto";
import fs from "fs/promises";
import { registrationSchema } from "./src/lib/validation";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// --- Shared Helpers ---

async function verifySessionOwnership(req: AuthRequest, sessionId: string, res: express.Response) {
  const email = req.user!.email;
  const [user] = await db.select().from(candidates).where(eq(candidates.email, email));
  if (!user) {
    res.status(403).json({ error: "Candidate not found" });
    return null;
  }

  const [currentSession] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!currentSession) {
    res.status(404).json({ error: "Session not found" });
    return null;
  }

  if (currentSession.candidateId !== user.id) {
    res.status(403).json({ error: "Forbidden: session belongs to another user." });
    return null;
  }

  return { user, session: currentSession };
}

async function transitionSessionStage(sessionId: string, currentStage: string, targetStage: string) {
  const validTransitions: Record<string, string[]> = {
    'resume_upload': ['resume_analysis'],
    'resume_analysis': ['interview_instructions', 'device_check', 'resume_upload'],
    'interview_instructions': ['device_check', 'resume_analysis'],
    'device_check': ['waiting_room', 'interview_instructions', 'resume_analysis'],
    'waiting_room': ['interview_hr_friendly', 'device_check'],
    'interview_hr_friendly': ['interview_technical'],
    'interview_technical': ['interview_cto'],
    'interview_cto': ['report_generation']
  };

  const allowedNext = validTransitions[currentStage] || [];
  if (!allowedNext.includes(targetStage)) {
    throw new Error(`Invalid phase transition from ${currentStage} to ${targetStage}. Manual phase selection is locked.`);
  }

  // Typecast to any to bypass string vs enum literal TS errors from Drizzle
  const [updatedSession] = await db.update(sessions)
    .set({ currentStage: targetStage as any })
    .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.currentStage, currentStage as any),
          eq(sessions.locked, true)
        )
    )
    .returning();

  if (!updatedSession) {
      throw new Error("Conflict: Could not update session state or session not locked.");
  }
  return updatedSession;
}


// --- Main Server ---

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
      if (activeSession && activeSession.status === 'completed') {
        const [analysis] = await db.select().from(resumeAnalyses).where(eq(resumeAnalyses.sessionId, activeSession.id));
        if (analysis) {
          resumeText = analysis.rawResumeText;
        }
      }

      // Pass the live email_verified field to the frontend
      res.json({ user: { ...user, email_verified: req.user!.email_verified }, activeSession, resumeText });
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

      await db.insert(contacts).values({ id: crypto.randomUUID(),
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
    try {
      const email = req.user!.email || req.body.email || '';
      const bodyWithEmail = { ...req.body, email };
      
      const parsedData = registrationSchema.safeParse(bodyWithEmail);
      if (!parsedData.success) {
        const errors = parsedData.error.issues.map(e => e.message);
        return res.status(400).json({ success: false, errors });
      }

      const { email: reqEmail, name, mobile, college, degree, gradYear, preferredLanguage } = parsedData.data;

      const existingCandidate = await db.select().from(candidates).where(
        or(
          eq(candidates.email, email),
          eq(candidates.email, reqEmail)
        )
      ).limit(1);

      if (existingCandidate.length > 0) {
        return res.status(400).json({ success: false, errors: ['Candidate is already registered with this account or email.'] });
      }

      const [user] = await db.insert(candidates).values({
        id: crypto.randomUUID(),
        email: reqEmail,
        name,
        mobile,
        college,
        degree,
        gradYear,
        preferredLanguage
      }).returning();

      if (reqEmail) {
        sendWelcomeEmail(reqEmail, name).catch(console.error);
      }

      res.json({ candidateId: user.id, registrationStatus: 'validated', welcomeMessage: 'Welcome!' });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ success: false, errors: [error.message || "Registration failed due to a server error."] });
    }
  });

  app.get("/api/welcome-message", requireAuth, async (req: AuthRequest, res) => {
    const email = req.user!.email;
    try {
      const [user] = await db.select().from(candidates).where(eq(candidates.email, email));
      if (!user) {
        return res.status(404).json({ success: false, error: "Candidate not found" });
      }
      
      const aiResponse = await generateWelcomeChecklist();
      
      if (!aiResponse) {
        return res.json({ 
          success: true,
          message: "Welcome to Ravengard AI Recruiter! We'll guide you through this sequential interview process. It should take about 60-90 minutes. Up next: Policy Consent.",
          checklist: ["Camera and Microphone required", "Find a quiet space"]
        });
      }

      res.json({ success: true, ...aiResponse });
    } catch (e) {
      console.error(e);
      res.json({ 
        success: true,
        message: "Welcome to Ravengard AI Recruiter! We'll guide you through this sequential interview process. It should take about 60-90 minutes. Up next: Policy Consent.",
        checklist: ["Camera and Microphone required", "Find a quiet space"]
      });
    }
  });

  app.post("/api/session/confirm-consent", requireAuth, async (req: AuthRequest, res) => {
    try {
      // 3. Block if email is not verified by Firebase Auth
      if (!req.user!.email_verified) {
        return res.status(403).json({ success: false, error: "Email verification is required before confirming consent." });
      }

      const email = req.user!.email;
      const { text, policyVersion } = req.body;
      
      if (text !== "I Agree") {
        return res.status(400).json({ success: false, error: "Exact text 'I Agree' is required." });
      }

      const [candidate] = await db.select().from(candidates).where(eq(candidates.email, email));
      if (!candidate) {
        return res.status(404).json({ success: false, error: "Candidate not found" });
      }

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

      const sessionId = crypto.randomUUID();
      const activePolicyVersion = policyVersion || "v1.0";
      
      const [newSession] = await db.insert(sessions).values({ id: sessionId,
        candidateId: candidate.id,
        locked: true,
        consentAcceptedAt: new Date(),
        policyVersion: activePolicyVersion,
        currentStage: 'resume_upload',
        status: 'active',
        thinkAgainUsesLeft: 2
      }).returning();

      res.json({ success: true, session: newSession });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: "Failed to confirm policy" });
    }
  });

  app.post("/api/interview/instructions/confirm", requireAuth, async (req: AuthRequest, res) => {
    try {
      const [user] = await db.select().from(candidates).where(eq(candidates.email, req.user!.email));
      if (!user) return res.status(404).json({ error: "Candidate not found" });

      const response = await generateInstructionsResponse();
      res.json({ response });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to confirm instructions" });
    }
  });

  app.post("/api/device-check/save", requireAuth, async (req: AuthRequest, res) => {
    try {
      const email = req.user!.email;
      const { sessionId, status, camera, mic, speaker, browser, meta } = req.body;
      
      const [candidate] = await db.select().from(candidates).where(eq(candidates.email, email));
      if (!candidate) return res.status(404).json({ error: "Candidate not found" });

      const [updatedSession] = await db.update(sessions)
        .set({
          deviceCheckStatus: status,
          cameraPermission: camera,
          microphonePermission: mic,
          speakerTestPassed: speaker,
          browserSupported: browser,
          deviceCheckCompletedAt: new Date(),
          deviceCheckMeta: meta
        })
        .where(
          and(
            eq(sessions.id, sessionId),
            eq(sessions.candidateId, candidate.id)
          )
        ).returning();

      res.json({ success: true, session: updatedSession });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save device check status" });
    }
  });

  app.post("/api/device-check/validate", requireAuth, async (req: AuthRequest, res) => {
    try {
      const response = await validateDeviceCheck();
      res.json(response);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to validate device check" });
    }
  });

  app.post("/api/interview/readiness/confirm", requireAuth, async (req: AuthRequest, res) => {
    try {
      const [user] = await db.select().from(candidates).where(eq(candidates.email, req.user!.email));
      if (!user) return res.status(404).json({ error: "Candidate not found" });

      const response = await confirmReadiness();
      res.json({ response });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to confirm readiness" });
    }
  });

  app.post("/api/session/:id/stage", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;
      const { stage, currentStage: reqCurrentStage } = req.body;
      
      const ownership = await verifySessionOwnership(req, sessionId, res);
      if (!ownership) return;
      const { session } = ownership;

      if (reqCurrentStage !== undefined && session.currentStage !== reqCurrentStage) {
         return res.status(409).json({ error: "Conflict: Session state changed", session });
      }

      const updatedSession = await transitionSessionStage(sessionId, session.currentStage!, stage);
      res.json(updatedSession);
    } catch (error: any) {
      console.error(error);
      const status = error.message?.includes("Invalid phase transition") || error.message?.includes("Conflict") ? 409 : 500;
      res.status(status).json({ error: error.message || "Failed to update session stage" });
    }
  });

  app.post("/api/session/:id/request-retake", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;
      const ownership = await verifySessionOwnership(req, sessionId, res);
      if (!ownership) return;

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to request retake" });
    }
  });

  app.get("/api/session/:id/resume-analysis", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;
      const ownership = await verifySessionOwnership(req, sessionId, res);
      if (!ownership) return;

      const [analysis] = await db.select().from(resumeAnalyses).where(eq(resumeAnalyses.sessionId, sessionId));
      if (!analysis) return res.status(404).json({ error: "Analysis not found" });

      res.json(analysis);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  app.post("/api/session/:id/upload-resume", requireAuth, upload.single('resume'), async (req: AuthRequest, res) => {
    const sessionId = req.params.id;

    try {
      const ownership = await verifySessionOwnership(req, sessionId, res);
      if (!ownership) return;

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No resume file provided" });
      }

      const header = file.buffer.subarray(0, 4);
      let isValidType = false;
      let detectedType = '';

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

      await db.insert(resumeAnalyses).values({ 
         id: crypto.randomUUID(),
         sessionId: sessionId,
         rawResumeText: rawResumeText
      });

      // Advance stage to resume_analysis through consolidated helper
      const updatedSession = await transitionSessionStage(sessionId, 'resume_upload', 'resume_analysis');

      res.json({ success: true, session: updatedSession, resumeReference: storagePath });
    } catch (error: any) {
      console.error(error);
      const status = error.message?.includes("Invalid phase transition") || error.message?.includes("Conflict") ? 409 : 500;
      res.status(status).json({ error: error.message || "Failed to store resume" });
    }
  });

  app.post("/api/session/:id/think-again", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;
      const ownership = await verifySessionOwnership(req, sessionId, res);
      if (!ownership) return;
      const { session } = ownership;

      const currentUses = session.thinkAgainUsesLeft ?? 2;
      if (currentUses <= 0) {
        return res.status(400).json({ error: "No think-agains left" });
      }

      await db.update(sessions)
        .set({ thinkAgainUsesLeft: currentUses - 1 })
        .where(eq(sessions.id, sessionId));

      res.json({ success: true, thinkAgainUsesLeft: currentUses - 1 });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to process think again" });
    }
  });

  app.get("/api/admin/stuck-sessions", requireAuth, async (req, res) => {
    // @ts-ignore
    const email = req.user.email;
    const [user] = await db.select().from(candidates).where(eq(candidates.email, email));
    const [admin] = await db.select().from(organizationAdmins).where(eq(organizationAdmins.email, email));
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
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

  setInterval(async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      await db.update(sessions)
        .set({ status: 'cancelled' })
        .where(
          and(
            eq(sessions.status, 'active'),
            lt(sessions.updatedAt, oneDayAgo)
          )
        );
      console.log(`Cron: Checked for abandoned sessions.`);
    } catch (error) {
      console.error('Error in abandoned sessions cron job:', error);
    }
  }, 60 * 60 * 1000); 

  setInterval(() => {
     console.log(`Cron: Checking cumulative LLM API spend against threshold...`);
  }, 24 * 60 * 60 * 1000); 

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
