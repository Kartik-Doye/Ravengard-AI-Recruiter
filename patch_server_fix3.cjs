const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace all candidates references to users in the routes
code = code.replace(/candidateId/g, 'userId');
code = code.replace(/candidates/g, 'users');
code = code.replace(/const \[candidate\]/g, 'const [user]');
code = code.replace(/candidate\./g, 'user.');
code = code.replace(/resumeAnalyses/g, 'resumeParses');
code = code.replace(/retakeRequests/g, '/* removed */');
code = code.replace(/integrityEvents/g, 'sessionViolations');
code = code.replace(/currentStage/g, 'currentPhase');
code = code.replace(/thinkAgainUsed/g, 'thinkAgainUsesLeft');
code = code.replace(/parseInt\(req\.params\.id\)/g, 'req.params.id');

fs.writeFileSync('server.ts', code);
