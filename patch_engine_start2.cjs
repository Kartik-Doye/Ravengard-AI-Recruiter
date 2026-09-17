const fs = require('fs');
let code = fs.readFileSync('src/pages/InterviewEngine.tsx', 'utf8');

const regex = /const startSession = async \(\) => \{[\s\S]*?startSession\(\);/;
const replacement = `const startSession = async () => {
      let timeoutId;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 45000);
        const res = await fetch(\`/api/interview/\${session.id}/start\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
          signal: controller.signal
        });
        const data = await res.json();
        if (data.success) {
          setInterviewSession(data.interviewSession);
          fetchNextQuestion();
        }
      } catch (e) {
        console.error("Failed to start session:", e);
        if (e && e.name === 'AbortError') {
           setQuestionText('Starting the interview took too long. Please refresh the page and try again.');
           setLoading(false);
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
    startSession();`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/InterviewEngine.tsx', code);
