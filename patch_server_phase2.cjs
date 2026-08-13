const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importReplacement = `import { validateRegistration, analyzeResume, generateWelcomeChecklist, validatePolicyConsent, generateInstructionsResponse, validateDeviceCheck, confirmReadiness } from "./src/lib/ai.ts";\n`;

code = code.replace(/import { validateRegistration.*? } from "\.\/src\/lib\/ai\.ts";/, importReplacement.trim());

const endpoints = `
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
`;

code = code.replace(
  'app.post("/api/session/:id/stage", requireAuth, async (req: AuthRequest, res) => {',
  endpoints + '\n  app.post("/api/session/:id/stage", requireAuth, async (req: AuthRequest, res) => {'
);

fs.writeFileSync('server.ts', code);
