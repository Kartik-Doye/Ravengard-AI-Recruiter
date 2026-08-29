const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Insert helpers before startServer
const helpers = `
async function verifySessionOwnership(req, sessionId, res) {
  const email = req.user.email;
  const [user] = await db.select().from(candidates).where(eq(candidates.email, email));
  if (!user) {
    res.status(403).json({ error: "Candidate not found" });
    return null;
  }

  const [currentSession] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!currentSession) {
    res.status(404).json({ error: "Session not found" });
    return null;
  }

  if (currentSession.candidateId !== user.id) {
    res.status(403).json({ error: "Forbidden: session belongs to another user." });
    return null;
  }

  return { user, session: currentSession };
}

async function transitionSessionStage(sessionId, currentStage, targetStage) {
  const validTransitions = {
    'resume_upload': ['resume_analysis'],
    'resume_analysis': ['interview_instructions', 'resume_upload'],
    'interview_instructions': ['device_check', 'resume_analysis'],
    'device_check': ['waiting_room', 'interview_instructions'],
    'waiting_room': ['interview_hr_friendly', 'device_check'],
    'interview_hr_friendly': ['interview_technical'],
    'interview_technical': ['interview_cto'],
    'interview_cto': ['report_generation']
  };

  const allowedNext = validTransitions[currentStage] || [];
  if (!allowedNext.includes(targetStage)) {
    throw new Error(\`Invalid phase transition from \${currentStage} to \${targetStage}. Manual phase selection is locked.\`);
  }

  const [updatedSession] = await db.update(sessions)
    .set({ currentStage: targetStage })
    .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.currentStage, currentStage),
          eq(sessions.locked, true)
        )
    )
    .returning();

  if (!updatedSession) {
      throw new Error("Conflict: Could not update session state or session not locked.");
  }
  return updatedSession;
}
`;

// wait I should just overwrite the whole file using a cleaner structure to ensure there are no parsing issues
