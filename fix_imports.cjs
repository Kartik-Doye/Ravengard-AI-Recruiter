const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

code = code.replace(/\.ts"/g, "\"");
fs.writeFileSync('/app/applet/server.ts', code);
