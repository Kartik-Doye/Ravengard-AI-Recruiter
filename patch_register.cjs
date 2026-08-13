const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const libImport = `import { validateRegistration, analyzeResume } from "./src/lib/ai.ts";\n`;
if (!code.includes('validateRegistration')) {
  code = code.replace('import { sendWelcomeEmail }', libImport + 'import { sendWelcomeEmail }');
}

const registerCode = `
  app.post("/api/register", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const { name, mobile, college, degree, gradYear, preferredLanguage } = req.body;
      const email = req.user!.email || req.body.email || '';

      const aiValidation = await validateRegistration({ name, mobile, email, college, degree, gradYear, language: preferredLanguage });
      if (!aiValidation.valid) {
        return res.status(400).json({ error: "Validation Failed", details: aiValidation.errors });
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

      // Send welcome email asynchronously
      if (email) {
        sendWelcomeEmail(email, name).catch(console.error);
      }

      res.json({ candidate, welcomeMessage: aiValidation.welcomeMessage });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Registration failed", details: String(error) });
    }
  });
`;

code = code.replace(/app\.post\("\/api\/register", requireAuth, async \(req: AuthRequest, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: "Registration failed", details: String\(error\) \}\);\n    \}\n  \}\);/, registerCode.trim());

fs.writeFileSync('server.ts', code);
