const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const registerStart = code.indexOf('app.post("/api/register"');
const welcomeStart = code.indexOf('app.get("/api/welcome-message"');
const newRegister = `app.post("/api/register", requireAuth, async (req: AuthRequest, res) => {
    try {
      const parsedData = registrationSchema.safeParse(req.body);
      if (!parsedData.success) {
        const errors = parsedData.error.issues.map(e => e.message);
        return res.status(400).json({ success: false, errors });
      }

      const { email: reqEmail, name, mobile, college, degree, gradYear, preferredLanguage } = parsedData.data;

      const existingCandidate = await db.select().from(candidates).where(
        eq(candidates.id, req.user!.id)
      ).limit(1);

      if (existingCandidate.length > 0) {
        return res.status(400).json({ success: false, errors: ['Candidate is already registered.'] });
      }

      const [user] = await db.insert(candidates).values({
        id: req.user!.id,
        email: reqEmail,
        name,
        mobile,
        college,
        degree,
        gradYear,
        preferredLanguage
      }).returning();

      res.json({ candidateId: user.id, registrationStatus: 'validated', welcomeMessage: 'Welcome!' });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ success: false, errors: [error.message || "Registration failed due to a server error."] });
    }
  });\n\n  `;

code = code.substring(0, registerStart) + newRegister + code.substring(welcomeStart);
fs.writeFileSync('server.ts', code);
