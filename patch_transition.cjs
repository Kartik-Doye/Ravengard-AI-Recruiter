const fs = require('fs');

let file = fs.readFileSync('server.ts', 'utf8');

const regex = /async function transitionSessionStage\(sessionId: string, currentStage: string, targetStage: string\) {([\s\S]*?)const allowedNext = validTransitions\[currentStage\] \|\| \[\];/;

const replacement = `async function transitionSessionStage(sessionId: string, currentStage: string, targetStage: string) {
  const [sessionRecord] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!sessionRecord) throw new Error("Session not found");
  
  // Gate: Verify device readiness before allowing entry into the interview engine
  if (targetStage === 'interview_hr_friendly' && sessionRecord.deviceCheckStatus !== 'passed') {
    throw new Error("Cannot enter interview engine: Device check not passed.");
  }

  const validTransitions: Record<string, string[]> = {
    'resume_upload': ['resume_analysis'],
    'resume_analysis': ['interview_instructions', 'device_check', 'resume_upload'],
    'interview_instructions': ['device_check', 'resume_analysis'],
    'device_check': ['waiting_room', 'interview_instructions', 'resume_analysis'],
    'waiting_room': ['interview_hr_friendly', 'device_check'],
    'interview_hr_friendly': ['interview_technical'],
    'interview_technical': ['interview_cto'],
    'interview_cto': ['report_generation']
  };

  const allowedNext = validTransitions[currentStage] || [];`;

file = file.replace(regex, replacement);
fs.writeFileSync('server.ts', file);
