const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const server = \n  app\.get/g, 'app.get');

fs.writeFileSync('server.ts', code);
