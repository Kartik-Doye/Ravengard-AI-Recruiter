const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/eq\(sessions\.candidateId, companyId: 1, configSnapshot: \{\}, candidate\.id\)/g, 'eq(sessions.candidateId, candidate.id)');
code = code.replace(/eq\(sessions\.candidateId, companyId: 1, configSnapshot: \{\}, candidateId\)/g, 'eq(sessions.candidateId, candidateId)');
code = code.replace(/candidateId: session\.candidateId, companyId: 1, configSnapshot: \{\},/g, 'candidateId: session.candidateId, companyId: 1, configSnapshot: {},');
code = code.replace(/candidateId: request\.candidateId, companyId: 1, configSnapshot: \{\},/g, 'candidateId: request.candidateId, companyId: 1, configSnapshot: {},');

fs.writeFileSync('server.ts', code);
