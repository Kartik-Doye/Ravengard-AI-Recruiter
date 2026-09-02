const fs = require('fs');
let file = fs.readFileSync('src/pages/InterviewEngine.tsx', 'utf8');

const updatedSubmit = `  const handleSubmit = async () => {
    if (!response.trim() || !questionId) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch(\`/api/interview/\${session.id}/answer\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify({ questionId, responseText: response })
      });
      
      const data = await res.json();
      if (data.success) {
        fetchNextQuestion();
      }
    } catch (e) {
      console.error("Submit error", e);
    } finally {
      setIsSubmitting(false);
    }
  };`;

file = file.replace(/const handleSubmit = async \(\) => \{[\s\S]*?if \(loading\) \{/m, updatedSubmit + '\n\n  if (loading) {');
fs.writeFileSync('src/pages/InterviewEngine.tsx', file);
