const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

// Fix organizationAdmins missing import
code = code.replace(/import \{ candidates, sessions, resumeAnalyses, sessionViolations/g, "import { candidates, sessions, resumeAnalyses, organizationAdmins, sessionViolations");

// Fix .phone and .mobile issue in registration
code = code.replace(/eq\(candidates\.mobile, mobile\)/g, "eq(candidates.email, email)");
code = code.replace(/phone: req\.body\.phone/g, "email: req.body.email");
code = code.replace(/phone/g, "email");
code = code.replace(/mobile/g, "email");

// Remove .version checks 
code = code.replace(/version: activeSession.version/g, "");
code = code.replace(/const { stage, version } = req.body;/g, "const { stage } = req.body;");
code = code.replace(/if \(version !== currentSession\.version\) \{[\s\S]*?\}/g, "");
code = code.replace(/if \(req\.body\.version !== session\.version\) \{[\s\S]*?\}/g, "");
code = code.replace(/version: session.version \+ 1/g, "");
code = code.replace(/version: currentSession\.version \+ 1/g, "");
code = code.replace(/, version: currentSession\.version \+ 1/g, "");

fs.writeFileSync('/app/applet/server.ts', code);
