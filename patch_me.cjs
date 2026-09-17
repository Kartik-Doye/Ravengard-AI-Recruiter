const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/res\.json\(\{ user: \{ \.\.\.user, email_verified: req\.user!\.email_verified \}, activeSession, resumeText \}\);/, 
'res.json({ candidate: { ...user, email_verified: req.user!.email_verified }, activeSession, resumeText });');

fs.writeFileSync('server.ts', code);
