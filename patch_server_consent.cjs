const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const consentImport = `import { validatePolicyConsent } from "./src/lib/ai.ts";\n`;
if (!code.includes('validatePolicyConsent')) {
  code = code.replace('import { validateRegistration, analyzeResume, generateWelcomeChecklist }', 'import { validateRegistration, analyzeResume, generateWelcomeChecklist, validatePolicyConsent }');
}

const consentEndpoint = `
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
`;

code = code.replace(
  'app.post("/api/session/:id/stage", requireAuth, async (req: AuthRequest, res) => {',
  consentEndpoint + '\n  app.post("/api/session/:id/stage", requireAuth, async (req: AuthRequest, res) => {'
);

fs.writeFileSync('server.ts', code);
