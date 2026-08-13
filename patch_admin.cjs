const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const adminCode = `
  app.get("/api/admin/retake-requests", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.admin) return res.status(403).json({ error: "Forbidden" });
      const requests = await db.select().from(retakeRequests).where(eq(retakeRequests.status, 'pending'));
      res.json(requests);
    } catch (e) { res.status(500).json({ error: "Failed to fetch retake requests" }); }
  });

  app.post("/api/admin/retake-requests/:id/approve", requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user!.admin) return res.status(403).json({ error: "Forbidden" });
      const requestId = parseInt(req.params.id);
      
      const [request] = await db.select().from(retakeRequests).where(eq(retakeRequests.id, requestId));
      if (!request) return res.status(404).json({ error: "Not found" });

      // Approve retake request - create a new session
      const [newSession] = await db.insert(sessions).values({
        candidateId: request.candidateId,
        locked: true,
        consentAcceptedAt: null,
        currentStage: 'consent',
        status: 'created',
        version: 1
      }).returning();

      await db.update(retakeRequests).set({
        status: 'approved',
        reviewedBy: req.user!.uid,
        reviewedAt: new Date()
      }).where(eq(retakeRequests.id, requestId));

      res.json({ success: true, newSession });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to approve retake request" });
    }
  });
`;

code = code.replace(/app\.listen\(PORT, "0\.0\.0\.0"/, adminCode + '\n  app.listen(PORT, "0.0.0.0"');
fs.writeFileSync('server.ts', code);
