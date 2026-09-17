const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const updatedSession = await transitionSessionStage\(session\.id, 'resume_upload', 'resume_upload'\);\n      res\.json\(\{ success: true, session: updatedSession \}\);/, 'res.json({ success: true, session });');

fs.writeFileSync('server.ts', code);
