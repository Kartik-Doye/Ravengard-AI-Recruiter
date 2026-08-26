const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/hooks/useInterviewFlow.ts', 'utf8');

code = code.replace(/'resume': '\/interview\/upload',/, "'resume': '/interview/upload',\n  'resume_upload': '/interview/upload',");
fs.writeFileSync('/app/applet/src/hooks/useInterviewFlow.ts', code);
