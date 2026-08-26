const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/pages/InterviewGateway.tsx', 'utf8');

// We need a way to track the pre-session state (welcome -> consent)
// Add a local state for preSessionStage
code = code.replace(/const \[activeSession, setActiveSession\] = useState<any>\(null\);/, 
  "const [activeSession, setActiveSession] = useState<any>(null);\n  const [preSessionStage, setPreSessionStage] = useState<'welcome' | 'consent'>('welcome');");

// In useInterviewFlow, we pass preSessionStage
code = code.replace(/const \{ activeStage \} = useInterviewFlow\(currentView === 'session' \? activeSession : null, loading \|\| !user \|\| !candidate \|\| currentView === 'dashboard'\);/,
  "const { activeStage } = useInterviewFlow(currentView === 'session' ? (activeSession || { currentStage: preSessionStage }) : null, loading || !user || !candidate || currentView === 'dashboard');");

fs.writeFileSync('/app/applet/src/pages/InterviewGateway.tsx', code);
