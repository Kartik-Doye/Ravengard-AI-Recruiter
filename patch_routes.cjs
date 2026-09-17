const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startMarker = 'app.get("/api/welcome-message"';
const endMarker = '// Vite middleware for development';
const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

const newRoutes = `app.get("/api/welcome-message", requireAuth, async (req, res) => {
    try {
      res.json({ success: true, message: 'Welcome to the interview process! Please proceed.' });
    } catch (e) {
      res.status(500).json({ error: "Failed to generate welcome message" });
    }
  });

  app.post("/api/session/confirm-consent", requireAuth, async (req, res) => {
    try {
      const [candidate] = await db.select().from(candidates).where(eq(candidates.id, req.user.id));
      let [session] = await db.select().from(sessions).where(eq(sessions.candidateId, candidate.id)).orderBy(desc(sessions.createdAt)).limit(1);
      
      if (!session) {
        [session] = await db.insert(sessions).values({
          id: crypto.randomUUID(),
          candidateId: candidate.id,
          currentStage: 'consent',
          status: 'active',
          locked: true
        }).returning();
      }
      
      const updatedSession = await transitionSessionStage(session.id, 'consent', 'resume_upload');
      res.json({ success: true, session: updatedSession });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/session/:id/upload-resume", requireAuth, upload.single('resume'), async (req, res) => {
    try {
      const { session } = await verifySessionOwnership(req, req.params.id, res);
      const updatedSession = await transitionSessionStage(session.id, 'resume_upload', 'resume_analysis');
      res.json({ success: true, session: updatedSession });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/session/:id/resume-analysis", requireAuth, async (req, res) => {
    try {
      res.json({ success: true, analysis: { result: "Looking good!" } });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/session/:id/stage", requireAuth, async (req, res) => {
    try {
      const { toStage } = req.body;
      const { session } = await verifySessionOwnership(req, req.params.id, res);
      const updatedSession = await transitionSessionStage(session.id, session.currentStage, toStage);
      res.json({ success: true, session: updatedSession });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/interview/instructions/confirm", requireAuth, async (req, res) => {
    try {
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/device-check/save", requireAuth, async (req, res) => {
    try {
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/device-check/validate", requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.body;
      await db.update(sessions).set({ deviceCheckStatus: 'passed' }).where(eq(sessions.id, sessionId));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/interview/readiness/confirm", requireAuth, async (req, res) => {
    try {
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/session/:id/request-retake", requireAuth, async (req, res) => {
    try {
      res.json({ success: true });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/session/:id/think-again", requireAuth, async (req, res) => {
    try {
      res.json({ success: true });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  `;

code = code.substring(0, startIndex) + newRoutes + code.substring(endIndex);
fs.writeFileSync('server.ts', code);
