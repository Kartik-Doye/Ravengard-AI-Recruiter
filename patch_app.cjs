const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importReplacement = `import ResumeUpload from './components/ResumeUpload.tsx';\nimport ResumeAnalysis from './components/ResumeAnalysis.tsx';`;
code = code.replace("import ResumeUpload from './components/ResumeUpload.tsx';", importReplacement);

const stageCode = `
            ) : activeStage === 'resume' ? (
              <ResumeUpload session={activeSession} onNext={(session, text) => { 
                 setActiveSession(session); 
                 if (text) setResumeText(text);
                setCurrentView('session'); 
               }} />
            ) : activeStage === 'resume_analysis' ? (
              <ResumeAnalysis session={activeSession} onNext={(session) => { setActiveSession(session); }} />
            ) : activeStage === 'instructions' ? (
`;

code = code.replace(
/            \) : activeStage === 'resume' \? \([\s\S]*?            \) : activeStage === 'instructions' \? \(/,
  stageCode.trim() + " ("
);

fs.writeFileSync('src/App.tsx', code);
