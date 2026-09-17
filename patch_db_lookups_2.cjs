const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const email = req\.user!\.email;[\s\S]*?const \[user\] = await db\.select\(\)\.from\(candidates\)\.where\(eq\(candidates\.email, email\)\);/g, `const [user] = await db.select().from(candidates).where(eq(candidates.id, req.user!.id));`);
code = code.replace(/const email = req\.user!\.email;[\s\S]*?const \[candidate\] = await db\.select\(\)\.from\(candidates\)\.where\(eq\(candidates\.email, email\)\);/g, `const [candidate] = await db.select().from(candidates).where(eq(candidates.id, req.user!.id));`);
code = code.replace(/const email = req\.user\.email;[\s\S]*?const \[user\] = await db\.select\(\)\.from\(candidates\)\.where\(eq\(candidates\.email, email\)\);/g, `const [user] = await db.select().from(candidates).where(eq(candidates.id, req.user!.id));`);

fs.writeFileSync('server.ts', code);
