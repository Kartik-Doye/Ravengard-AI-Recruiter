const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

// Replace all sessions.userId with sessions.candidateId
code = code.replace(/sessions\.userId/g, "sessions.candidateId");
code = code.replace(/userId:/g, "candidateId:");

// Remove /api/session/start and /api/session/:id/policy-confirm
const startRegex = /app\.post\("\/api\/session\/start"[\s\S]*?\}\);/g;
const policyRegex = /app\.post\("\/api\/session\/:id\/policy-confirm"[\s\S]*?\}\);/g;

code = code.replace(startRegex, '');
code = code.replace(policyRegex, '');

// Insert the new confirm-consent route
const confirmConsentRoute = `
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
`;

code = code.replace(/app\.post\("\/api\/interview\/instructions\/confirm"/, confirmConsentRoute + '\n\n  app.post("/api/interview/instructions/confirm"');

fs.writeFileSync('/app/applet/server.ts', code);
