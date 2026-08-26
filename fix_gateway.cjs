const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/pages/InterviewGateway.tsx', 'utf8');

code = code.replace(/<Welcome onNext=\{\(session\) => \{ setActiveSession\(session\); setCurrentView\('session'\); \}\} candidate=\{candidate\} \/>/g, "<Welcome onNext={(session) => { if(session.currentStage === 'consent') setPreSessionStage('consent'); else setActiveSession(session); setCurrentView('session'); }} candidate={candidate} />");

fs.writeFileSync('/app/applet/src/pages/InterviewGateway.tsx', code);
