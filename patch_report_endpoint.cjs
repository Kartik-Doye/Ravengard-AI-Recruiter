const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf8');

const newEndpoint = `
  // --- Phase 6: Final Report Hooks ---
  app.post("/api/interview/:id/generate-report", requireAuth, async (req, res) => {
    try {
      const sessionId = req.params.id;
      const ownership = await verifySessionOwnership(req, sessionId, res);
      if (!ownership) return;
      const { session } = ownership;

      const [existingReport] = await db.select().from(interviewReports).where(eq(interviewReports.sessionId, sessionId));
      if (existingReport) {
        return res.json({ success: true, report: existingReport });
      }

      const sessionData = await db.select({
        questionText: interviewQuestions.questionText,
        responseText: interviewResponses.responseText,
      })
      .from(interviewQuestions)
      .leftJoin(interviewResponses, eq(interviewQuestions.id, interviewResponses.questionId))
      .innerJoin(interviewSessions, eq(interviewQuestions.interviewSessionId, interviewSessions.id))
      .where(eq(interviewSessions.sessionId, sessionId));

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = \`Evaluate the candidate based on these interview questions and answers:
      \${JSON.stringify(sessionData)}
      
      Provide a JSON report with:
      - overallScore (0-100)
      - breakdown (object with keys like 'technical', 'communication', 'problem_solving' containing 0-100 scores)
      - strengths (array of strings)
      - weaknesses (array of strings)
      - recommendation (a short string paragraph)\`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text || '{}');

      const [report] = await db.insert(interviewReports).values({
        id: crypto.randomUUID(),
        sessionId,
        overallScore: parsed.overallScore || 0,
        breakdown: parsed.breakdown || {},
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        recommendation: parsed.recommendation || "No recommendation."
      }).returning();
      
      await db.update(sessions).set({ currentStage: 'report_generation', status: 'completed' }).where(eq(sessions.id, sessionId));
      
      res.json({ success: true, report });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/interview/:id/report", requireAuth, async (req, res) => {
    try {
      const sessionId = req.params.id;
      const ownership = await verifySessionOwnership(req, sessionId, res);
      if (!ownership) return;

      const [report] = await db.select().from(interviewReports).where(eq(interviewReports.sessionId, sessionId));
      if (!report) return res.status(404).json({ error: "Report not found" });

      res.json({ success: true, report });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });
`;

file = file.replace("setInterval(async () => {", newEndpoint + "\n  setInterval(async () => {");
fs.writeFileSync('server.ts', file);
