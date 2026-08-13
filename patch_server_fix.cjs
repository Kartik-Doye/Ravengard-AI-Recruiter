const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/retakeRequests, integrityEvents/g, 'retakeRequests');
code = code.replace(/import { candidates, sessions, resumeAnalyses, retakeRequests }/, 'import { candidates, sessions, resumeAnalyses, retakeRequests, integrityEvents }');

fs.writeFileSync('server.ts', code);
