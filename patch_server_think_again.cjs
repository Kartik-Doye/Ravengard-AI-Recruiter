const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const endpoint = `
  app.post("/api/session/:id/think-again", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session) return res.status(404).json({ error: "Session not found" });

      if (session.thinkAgainUsed >= 2) {
        return res.status(400).json({ error: "No think-agains left" });
      }

      await db.update(sessions)
        .set({ thinkAgainUsed: session.thinkAgainUsed + 1 })
        .where(eq(sessions.id, sessionId));

      res.json({ success: true, thinkAgainUsed: session.thinkAgainUsed + 1 });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to process think again" });
    }
  });
`;

code = code.replace(
  '  app.post("/api/session/:id/violation", requireAuth, async (req: AuthRequest, res) => {',
  endpoint + '\n  app.post("/api/session/:id/violation", requireAuth, async (req: AuthRequest, res) => {'
);

fs.writeFileSync('server.ts', code);
