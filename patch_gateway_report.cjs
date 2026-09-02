const fs = require('fs');
let file = fs.readFileSync('src/pages/InterviewGateway.tsx', 'utf8');

file = file.replace("import WaitingRoom from './WaitingRoom.tsx';", "import WaitingRoom from './WaitingRoom.tsx';\nimport FinalReport from './FinalReport';");
file = file.replace("import InterviewEngine from './InterviewEngine';", "import InterviewEngine from './InterviewEngine';\nimport FinalReport from './FinalReport';");

const newRoute = `             <Route path="report" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage={["report_generation", "completed"]}><FinalReport session={activeSession} /></ProtectedRoute>} />`;

file = file.replace(/<Route path="\*" element=\{<Navigate/, newRoute + '\n             <Route path="*" element={<Navigate');
fs.writeFileSync('src/pages/InterviewGateway.tsx', file);
