const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace more broken types and references
code = code.replace(/uid/g, 'email'); // uid was replaced with id and email in the new users schema
code = code.replace(/const \[candidate\] = await db\.select\(\)\.from\(users\)\.where\(eq\(users\.email, token\)\);/g, 'const [user] = await db.select().from(users).where(eq(users.id, token));');
code = code.replace(/candidateId/g, 'userId');
code = code.replace(/candidate/g, 'user');
code = code.replace(/resumeAnalyses/g, 'resumeParses');
code = code.replace(/const sessionId = parseInt\(req\.params\.id\);/g, 'const sessionId = req.params.id;');
code = code.replace(/parseInt\(sessionIdStr\)/g, 'sessionIdStr');
code = code.replace(/in_progress/g, 'active');

fs.writeFileSync('server.ts', code);
