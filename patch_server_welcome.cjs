const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const welcomeImport = `import { generateWelcomeChecklist } from "./src/lib/ai.ts";\n`;
if (!code.includes('generateWelcomeChecklist')) {
  code = code.replace('import { validateRegistration, analyzeResume }', 'import { validateRegistration, analyzeResume, generateWelcomeChecklist }');
}

const welcomeEndpoint = `
  app.get("/api/welcome-message", requireAuth, async (req: AuthRequest, res) => {
    try {
      const [candidate] = await db.select().from(candidates).where(eq(candidates.uid, req.user!.uid));
      if (!candidate) return res.status(404).json({ error: "Candidate not found" });
      
      const message = await generateWelcomeChecklist(candidate);
      res.json({ message });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate welcome" });
    }
  });
`;

code = code.replace(
  'app.post("/api/session/start", requireAuth, async (req: AuthRequest, res) => {',
  welcomeEndpoint + '\n  app.post("/api/session/start", requireAuth, async (req: AuthRequest, res) => {'
);

fs.writeFileSync('server.ts', code);
