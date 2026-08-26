const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

// The `role` check on line 496 is for candidates, but candidates don't have a role in the schema anymore (that moved to organizationAdmins). 
// Remove or fix the role check. 
// Also fix the `.phone` reference in the registration.

code = code.replace(/eq\(candidates\.phone, phone\)/g, "eq(candidates.email, email)");
code = code.replace(/phone,/g, "");

fs.writeFileSync('/app/applet/server.ts', code);
