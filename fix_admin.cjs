const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');
code = code.replace(/if \(\!user \|\| user\.role \!\=\= \'admin\'\) \{/g, "const [admin] = await db.select().from(organizationAdmins).where(eq(organizationAdmins.email, email));\n    if (!admin || admin.role !== 'admin') {");
fs.writeFileSync('/app/applet/server.ts', code);
