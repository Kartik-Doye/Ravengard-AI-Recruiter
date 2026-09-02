const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf8');

const newEndpoints = `
  // --- Phase 4: Interview Engine Endpoints ---
  app.post("/api/interview/:id/start", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;
      const ownership = await verifySessionOwnership(req, sessionId, res);
      if (!ownership) return;
      const { session } = ownership;

      if (!session.currentStage.startsWith('interview_')) {
        return res.status(403).json({ error: "Session is not in an interview stage" });
      }

      // Check if interview session exists
      let [interviewSession] = await db.select().from(interviewSessions).where(eq(interviewSessions.sessionId, sessionId)).orderBy(desc(interviewSessions.startedAt)).limit(1);

      if (!interviewSession || interviewSession.status === 'completed') {
        [interviewSession] = await db.insert(interviewSessions).values({
          id: crypto.randomUUID(),
          sessionId,
          roundType: session.currentStage === 'interview_hr_friendly' ? 'hr' : 'technical',
        }).returning();
      }

      res.json({ success: true, interviewSession });
    } catch (error: any) {
      console.error("Failed to start interview:", error);
      res.status(500).json({ error: "Failed to start interview" });
    }
  });

  app.get("/api/interview/:id/stream-question", async (req, res) => {
    // We use a query param for auth in SSE since headers are hard to send in standard EventSource
    const token = req.query.token as string;
    if (!token) return res.status(401).json({ error: "Missing token" });

    let userId: string;
    try {
      if (process.env.NODE_ENV !== "production" && token.length < 500) {
        userId = token;
      } else {
        const decodedToken = await getAuth().verifyIdToken(token);
        userId = decodedToken.uid;
      }
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const sessionId = req.params.id;
    try {
      const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
      if (!session || session.candidateId !== userId) {
         return res.status(403).json({ error: "Forbidden" });
      }
      
      const [interviewSession] = await db.select().from(interviewSessions).where(eq(interviewSessions.sessionId, sessionId)).orderBy(desc(interviewSessions.startedAt)).limit(1);
      if (!interviewSession) return res.status(404).json({ error: "Interview session not found" });

      const prevQuestions = await db.select().from(interviewQuestions).where(eq(interviewQuestions.interviewSessionId, interviewSession.id)).orderBy(interviewQuestions.questionIndex);
      const questionIndex = prevQuestions.length + 1;

      // Create Question record first
      const [question] = await db.insert(interviewQuestions).values({
        id: crypto.randomUUID(),
        interviewSessionId: interviewSession.id,
        questionIndex,
        questionText: '' // We will update this after streaming
      }).returning();

      // SSE Setup
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // AI Generation
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Minimal context for the AI prompt
      const prompt = \`You are conducting a \${interviewSession.roundType} interview. This is question #\${questionIndex}. 
      Previous questions: \${prevQuestions.map(q => q.questionText).join(" | ")}. 
      Ask a professional, concise interview question. Only output the question text, no pleasantries.\`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        const text = chunk.text;
        fullText += text;
        res.write(\`data: \${JSON.stringify({ text })}\\\n\\\n\`);
      }

      await db.update(interviewQuestions).set({ questionText: fullText }).where(eq(interviewQuestions.id, question.id));

      res.write(\`data: \${JSON.stringify({ done: true, questionId: question.id })}\\\n\\\n\`);
      res.end();

    } catch (error: any) {
      console.error("Failed to stream question:", error);
      res.write(\`data: \${JSON.stringify({ error: "Failed to generate question" })}\\\n\\\n\`);
      res.end();
    }
  });

  app.post("/api/interview/:id/answer", requireAuth, async (req: AuthRequest, res) => {
    try {
      const sessionId = req.params.id;
      const ownership = await verifySessionOwnership(req, sessionId, res);
      if (!ownership) return;

      const { questionId, responseText } = req.body;
      if (!questionId || !responseText) return res.status(400).json({ error: "Missing required fields" });

      const [response] = await db.insert(interviewResponses).values({
        id: crypto.randomUUID(),
        questionId,
        responseText
      }).returning();

      res.json({ success: true, response });
    } catch (error: any) {
      console.error("Failed to submit answer:", error);
      res.status(500).json({ error: "Failed to submit answer" });
    }
  });
`;

// Insert the new endpoints before the closing of the function that configures the express app
// The last endpoint before this seems to be app.get("/api/admin/stuck-sessions"...)
// I'll just append it right before the 404 handler or the app.listen() call.
const splitStr = "  // --- Basic Catch-all and Serve logic ---";
if (file.includes(splitStr)) {
  file = file.replace(splitStr, newEndpoints + "\n" + splitStr);
  fs.writeFileSync('server.ts', file);
  console.log("Endpoints added successfully.");
} else {
  console.log("Could not find insertion point.");
}
