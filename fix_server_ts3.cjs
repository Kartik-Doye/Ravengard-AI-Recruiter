const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

code = code.replace(/const \{ email: reqEmail, email, gradYear \} = parsedData\.data;/g, "const { email: reqEmail, gradYear } = parsedData.data;");
code = code.replace(/email: email \|\| \'\'\, email,/g, "email: email || '',");
code = code.replace(/email: email,\n        name/g, "name");

fs.writeFileSync('/app/applet/server.ts', code);
