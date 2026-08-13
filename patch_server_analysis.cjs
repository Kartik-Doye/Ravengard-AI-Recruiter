const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const analysisEndpoint = `
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
`;

code = code.replace(
  'app.post("/api/session/:id/upload-resume", requireAuth, upload.single(\'resume\'), async (req: AuthRequest, res) => {',
  analysisEndpoint + '\n  app.post("/api/session/:id/upload-resume", requireAuth, upload.single(\'resume\'), async (req: AuthRequest, res) => {'
);

fs.writeFileSync('server.ts', code);
