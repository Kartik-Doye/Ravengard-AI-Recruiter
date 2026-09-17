const fs = require('fs');
let code = fs.readFileSync('src/pages/InterviewEngine.tsx', 'utf8');

code = code.replace(
  /const startSession = async \(\) => \{[\s\S]*?try \{[\s\S]*?const res = await fetch\(\`\/api\/interview\/\$\{session\.id\}\/start\`\, \{[\s\S]*?\}\);[\s\S]*?const data = await res\.json\(\);[\s\S]*?if \(data\.success\) \{[\s\S]*?setInterviewSession\(data\.interviewSession\);[\s\S]*?fetchNextQuestion\(\);[\s\S]*?\}[\s\S]*?\} catch \(e\) \{[\s\S]*?console\.error\("Failed to start session:", e\);[\s\S]*?\}[\s\S]*?\};\s*startSession\(\);/,
  `const startSession = async () => {
      let timeoutId: any;
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
      } catch (e: any) {
        console.error("Failed to start session:", e);
        if (e.name === 'AbortError') {
           setQuestionText('Starting the interview took too long. Please refresh the page and try again.');
           setLoading(false);
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
    startSession();`
);

fs.writeFileSync('src/pages/InterviewEngine.tsx', code);
