const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/candidateId: session\.candidateId, companyId: 1, configSnapshot: \{\},/g, 'candidateId: session.candidateId,');

fs.writeFileSync('server.ts', code);
