const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const violationCode = `
  app.post("/api/session/violation", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) return res.status(404).json({ error: "Session not found" });

      const [candidate] = await db.select().from(candidates).where(eq(candidates.uid, req.user!.uid));
      if (!candidate || session.candidateId !== candidate.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await db.insert(integrityEvents).values({
        sessionId,
        type: 'tab_switch_violation',
        severity: 'high',
        evidenceRef: 'visibilitychange'
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Violation log error", error);
      res.status(500).json({ error: "Failed to log violation" });
    }
  });
`;

if (!code.includes('app.post("/api/session/violation"')) {
  code = code.replace(
    'app.post("/api/session/:id/think-again"',
    violationCode.trim() + '\\n\\n  app.post("/api/session/:id/think-again"'
  );
  fs.writeFileSync('server.ts', code);
}
