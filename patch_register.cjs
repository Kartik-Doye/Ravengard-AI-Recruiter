const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /const email = req\.user!\.email \|\| req\.body\.email \|\| '';/,
  `const email = req.body.email || req.user!.email || '';`
);

code = code.replace(
  /if \(reqEmail\) \{[\s\S]*?res\.json\(\{ candidateId: user\.id, registrationStatus: 'validated', welcomeMessage: 'Welcome!' \}\);/,
  `res.json({ candidateId: user.id, registrationStatus: 'validated', welcomeMessage: 'Welcome!' });`
);

fs.writeFileSync('server.ts', code);
