const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = /let rawResumeText = "";[\s\S]*?const \[updatedSession\] = await db.update\(sessions\)/;

const replacement = `let rawResumeText = "";
      try {
        rawResumeText = await extractTextFromFile(file.buffer, detectedType as 'pdf' | 'docx');
      } catch (e) {
        return res.status(400).json({ error: "Failed to extract text from document." });
      }

      // Perform Gemini Analysis via service
      const analysis = await analyzeResumeWithAI(rawResumeText);

      await db.insert(resumeParses).values({
         id: crypto.randomUUID(),
         sessionId: sessionId,
         rawResumeText: rawResumeText,
         skills: analysis.skills,
         strengths: analysis.strengths,
         missingKeywords: analysis.missingKeywords
      });

      const [updatedSession] = await db.update(sessions)`;

code = code.replace(target, replacement);

fs.writeFileSync('server.ts', code);
