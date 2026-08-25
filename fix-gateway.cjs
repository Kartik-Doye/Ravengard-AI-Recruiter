const fs = require('fs');
let code = fs.readFileSync('src/pages/InterviewGateway.tsx', 'utf8');

// Replace imports and route mapping
code = code.replace(
  "const STAGE_ROUTE_MAP: Record<string, string> =",
  "import { ProtectedRoute } from '../components/interview/ProtectedRoute';\nimport { STAGE_ROUTE_MAP, useInterviewFlow } from '../hooks/useInterviewFlow';\nconst _UNUSED_STAGE_ROUTE_MAP_:"
);

// Remove Candidate Route Guard Effect
code = code.replace(
  /^\s*\/\/ Candidate Route Guard Effect[\s\S]*?\}, \[activeStage, location\.pathname, loading, user, candidate, currentView, navigate\]\);\n/m,
  "  const { activeStage } = useInterviewFlow(currentView === 'session' ? activeSession : null, loading || !user || !candidate || currentView === 'dashboard');\n"
);

// Replace the Routes setup with ProtectedRoute wrapping
code = code.replace(
  /<Route path="welcome" element=\{[\s\S]*?<Route path="\*" element=\{<Navigate to=\{STAGE_ROUTE_MAP\[activeStage\] \|\| "\/interview\/welcome"\} replace \/>\} \/>/m,
  `<Route path="welcome" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="welcome"><Welcome onNext={(session) => { setActiveSession(session); setCurrentView('session'); }} candidate={candidate} /></ProtectedRoute>} />
             <Route path="consent" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="consent"><Consent session={activeSession} onNext={(session) => { setActiveSession(session); setCurrentView('session'); }} /></ProtectedRoute>} />
             <Route path="upload" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="resume"><ResumeUpload session={activeSession} onNext={(session, text) => { setActiveSession(session); if (text) setResumeText(text); setCurrentView('session'); }} /></ProtectedRoute>} />
             <Route path="analysis" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage={["resume_analysis", "intelligence"]}><ResumeAnalysis session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="instructions" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="instructions"><InterviewInstructions session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="device-check" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="device_check"><DeviceCheck session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="waiting" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="waiting_room"><WaitingRoom session={activeSession} onNext={(session) => { setActiveSession(session); }} /></ProtectedRoute>} />
             <Route path="active" element={<ProtectedRoute activeSession={activeSession} loading={loading} allowedStage="interview_hr_friendly"><Interview session={activeSession} onNext={(session) => { setActiveSession(session); setCurrentView('dashboard'); addToast('success', 'Interview session complete!'); }} /></ProtectedRoute>} />
             <Route path="*" element={<Navigate to={STAGE_ROUTE_MAP[activeStage] || "/interview/welcome"} replace />} />`
);

fs.writeFileSync('src/pages/InterviewGateway.tsx', code);
