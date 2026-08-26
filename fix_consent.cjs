const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/components/Consent.tsx', 'utf8');

code = code.replace(/fetch\(\`\/api\/session\/\$\{session.id\}\/policy-confirm\`/, 
  "fetch(`/api/session/confirm-consent`");

// Let's also remove the visual styling since the user says they will provide 2D/3D visual UI polish step. 
// But wait, the user's focus is on the logic. I'll just leave the styling.
fs.writeFileSync('/app/applet/src/components/Consent.tsx', code);
