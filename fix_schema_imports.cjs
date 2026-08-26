const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/db/index.ts', 'utf8');
code = code.replace(/\.ts"/g, "\"");
fs.writeFileSync('/app/applet/src/db/index.ts', code);
