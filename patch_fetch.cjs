const fs = require('fs');
let code = fs.readFileSync('src/pages/InterviewGateway.tsx', 'utf8');

code = code.replace(
  /useEffect\(\(\) => \{\s*if \(\!user\) return;\s*const interval = setInterval\(\(\) => \{\s*fetchCandidateData\(user, true\); \/\/ silent fetch\s*\}, 10000\);[^\}]+\}, \[user\]\);/,
  `useEffect(() => {
    if (!user || !candidate) return;
    const interval = setInterval(() => {
      fetchCandidateData(user, true); // silent fetch
    }, 60000); 
    return () => clearInterval(interval);
  }, [user, candidate]);`
);

code = code.replace(
  /const timeoutId = setTimeout\(\(\) => \{ controller\.abort\(\); setIsTimeout\(true\); \}, 25000\);\s*const res = await fetch\('\/api\/me', \{[\s\S]*?\}\);\s*if \(res\.ok\) \{/,
  `const timeoutId = setTimeout(() => { controller.abort(); setIsTimeout(true); }, 25000);
      const res = await fetch('/api/me', {
        signal: controller.signal,
        headers: {
          Authorization: \`Bearer \${uid}\`
        }
      });
      clearTimeout(timeoutId);
      if (res.ok) {`
);

fs.writeFileSync('src/pages/InterviewGateway.tsx', code);
