const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

let lines = code.split('\n');
lines.splice(163, 49); // Remove lines 164 to 212
fs.writeFileSync('/app/applet/server.ts', lines.join('\n'));
