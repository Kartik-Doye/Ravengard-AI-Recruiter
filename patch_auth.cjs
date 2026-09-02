const fs = require('fs');
let file = fs.readFileSync('src/middleware/auth.ts', 'utf8');
file = file.replace(/token\.startsWith\('test-uid-'\)/, "token.length < 500");
fs.writeFileSync('src/middleware/auth.ts', file);
