const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/services/resume-processor.ts', 'utf8');
code = code.replace(/return text \|\| \'\';/g, "return (typeof text === 'string' ? text : text.join('\\n')) || '';");
fs.writeFileSync('/app/applet/src/services/resume-processor.ts', code);
