const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
  // --- Phase 5: Anti-Cheat Signal Hook ---
  app.post("/api/interview/:id/signal", requireAuth, async (req, res) => {
    try {
      const sessionId = req.params.id;
      const ownership = await verifySessionOwnership(req, sessionId, res);
      if (!ownership) return;

      const { signalType, metadata, interviewSessionId } = req.body;
      if (!signalType) return res.status(400).json({ error: "Missing signalType" });

      await db.insert(integritySignals).values({
        id: crypto.randomUUID(),
        sessionId,
        interviewSessionId,
        signalType,
        metadata: metadata ? JSON.stringify(metadata) : null
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Failed to log integrity signal:", error);
      res.status(500).json({ error: "Failed to log signal" });
    }
  });
`;

file = file.replace("setInterval(async () => {", newEndpoint + "\n  setInterval(async () => {");
fs.writeFileSync('server.ts', file);
