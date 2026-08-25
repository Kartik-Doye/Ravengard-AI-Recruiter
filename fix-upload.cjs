const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `const [updatedSession] = await db.update(sessions)
        .set({ currentPhase: 'resume_analysis' }) 
        .where(and(eq(sessions.id, sessionId), eq(sessions.locked, true)))
        .returning();`;

const replacement = `let rawResumeText = "";
      if (detectedType === 'pdf') {
        const pdfData = await pdfParse(file.buffer);
        rawResumeText = pdfData.text;
      } else if (detectedType === 'docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        rawResumeText = result.value;
      }

      // Perform Gemini Analysis
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = \`You are an expert HR Technical Recruiter. Extract the candidate's core skills, top strengths, and missing critical keywords based on the following resume text. Respond ONLY with a JSON object.
Schema: { "skills": ["skill1", "skill2"], "strengths": ["strength1", "strength2"], "missingKeywords": ["keyword1"] }

Resume Text:
\${rawResumeText.substring(0, 15000)}\`;

      let skills = [], strengths = [], missingKeywords = [];
      try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        const parsed = JSON.parse(response.text || "{}");
        skills = parsed.skills || [];
        strengths = parsed.strengths || [];
        missingKeywords = parsed.missingKeywords || [];
      } catch (err) {
        console.error("Gemini Analysis failed:", err);
      }

      await db.insert(resumeParses).values({
         id: crypto.randomUUID(),
         sessionId: sessionId,
         rawResumeText: rawResumeText,
         skills: skills,
         strengths: strengths,
         missingKeywords: missingKeywords
      });

      const [updatedSession] = await db.update(sessions)
        .set({ currentPhase: 'resume_analysis' }) 
        .where(and(eq(sessions.id, sessionId), eq(sessions.locked, true)))
        .returning();`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
