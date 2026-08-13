const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const resumeRoute = `
  app.post("/api/session/:id/upload-resume", requireAuth, upload.single('resume'), async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "No resume file provided" });
      }

      let rawText = '';
      if (file.mimetype === 'application/pdf') {
        const pdfDocument = await getDocumentProxy(new Uint8Array(file.buffer));
        const { text } = await extractText(pdfDocument, { mergePages: true });
        rawText = text;
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        rawText = result.value;
      } else {
        return res.status(400).json({ error: "Unsupported file type. Please upload PDF or DOCX." });
      }

      // Phase 1: AI Analysis
      const analysis = await analyzeResume(rawText, "Software Engineer");

      await db.insert(resumeAnalyses).values({
        sessionId,
        rawText,
        skills: analysis.skills,
        projects: analysis.projects,
        experience: analysis.experience,
        education: analysis.education,
        certifications: analysis.certifications,
        atsScore: analysis.atsScore,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        missingKeywords: analysis.missingKeywords,
        recruiterReviewText: analysis.recruiterReviewText
      });

      const [updatedSession] = await db.update(sessions)
        .set({ currentStage: 'resume_analysis', status: 'in_progress', resumeUrl: file.originalname })
        .where(eq(sessions.id, sessionId))
        .returning();

      res.json({ session: updatedSession, resumeText: rawText, analysis });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process resume", details: String(error) });
    }
  });
`;

code = code.replace(/app\.post\("\/api\/session\/:id\/upload-resume"[\s\S]*?res\.status\(500\)\.json\(\{ error: "Failed to process resume", details: String\(error\) \}\);\n    \}\n  \}\);/, resumeRoute.trim());

fs.writeFileSync('server.ts', code);
