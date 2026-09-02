const fs = require('fs');
let file = fs.readFileSync('src/pages/InterviewEngine.tsx', 'utf8');

// Change hardcoded 'interview_technical' progression to just fetchNextQuestion
file = file.replace(
  /const stageRes = await fetch\(\`\/api\/session\/\$\{session\.id\}\/stage\`, \{[\s\S]*?\} else \{[\s\S]*?fetchNextQuestion\(\); \/\/ Get next Q if not advancing stage[\s\S]*?\}/,
  'fetchNextQuestion();'
);

// Add finish interview method
const newMethods = `
  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const stageRes = await fetch(\`/api/session/\${session.id}/stage\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify({ stage: 'report_generation', currentStage: session.currentStage })
      });
      if (stageRes.ok) {
        const updated = await stageRes.json();
        onNext(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };
`;

file = file.replace('const handleSubmit = async () => {', newMethods + '\n  const handleSubmit = async () => {');

// Add button to UI
const newButtons = `
          <Button 
            variant="outline"
            onClick={handleFinish} 
            disabled={isStreaming || isSubmitting}
            className="mr-3"
          >
            Finish Interview
          </Button>
          <Button 
            onClick={handleSubmit} 
`;

file = file.replace('<Button \n            onClick={handleSubmit} ', newButtons);

fs.writeFileSync('src/pages/InterviewEngine.tsx', file);
