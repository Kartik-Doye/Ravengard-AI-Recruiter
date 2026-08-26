const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

// Fix the 'users' reference
code = code.replace(/\busers\b/g, "candidates");
code = code.replace(/\buserId\b/g, "candidateId");

// Revert 'users' in some places if needed, but 'candidates' is fine for the table.
// There is an import for Firebase AuthRequest which has `req.user`, so be careful not to replace `req.user`.

fs.writeFileSync('/app/applet/server.ts', code);
