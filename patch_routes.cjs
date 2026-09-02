const fs = require('fs');
let file = fs.readFileSync('src/pages/InterviewGateway.tsx', 'utf8');

// Add import for InterviewEngine
file = file.replace("import WaitingRoom from './WaitingRoom';", "import WaitingRoom from './WaitingRoom';\nimport InterviewEngine from './InterviewEngine';");

// Add route for InterviewEngine
const newRoute = `             <Route path="engine" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage={["interview_hr_friendly", "interview_technical", "interview_cto"]}><InterviewEngine session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />`;

file = file.replace(/<Route path="\*" element=\{<Navigate/, newRoute + '\n             <Route path="*" element={<Navigate');
fs.writeFileSync('src/pages/InterviewGateway.tsx', file);
