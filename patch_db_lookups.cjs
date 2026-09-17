const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace /api/register UUID insertion with req.user!.id
code = code.replace(
  /const \[user\] = await db\.insert\(candidates\)\.values\(\{\s*id: crypto\.randomUUID\(\),/g,
  `const [user] = await db.insert(candidates).values({
        id: req.user!.id,`
);

// Replace all candidates.email lookups to candidates.id lookups where it relies on req.user!.email or email (which was derived from req.user!.email)
// Note: we can just match `eq(candidates.email, email)` and `eq(candidates.email, req.user!.email)` and change them to `eq(candidates.id, req.user!.id)`

code = code.replace(/eq\(candidates\.email, req\.user!\.email\)/g, `eq(candidates.id, req.user!.id)`);
code = code.replace(/const email = req\.user!\.email;\s*const \[user\] = await db\.select\(\)\.from\(candidates\)\.where\(eq\(candidates\.email, email\)\);/g, `const [user] = await db.select().from(candidates).where(eq(candidates.id, req.user!.id));`);
code = code.replace(/const email = req\.user!\.email;\s*const \[candidate\] = await db\.select\(\)\.from\(candidates\)\.where\(eq\(candidates\.email, email\)\);/g, `const [candidate] = await db.select().from(candidates).where(eq(candidates.id, req.user!.id));`);

// For verifySessionOwnership
code = code.replace(/const email = req\.user!\.email;\n  const \[user\] = await db\.select\(\)\.from\(candidates\)\.where\(eq\(candidates\.email, email\)\);/, `const [user] = await db.select().from(candidates).where(eq(candidates.id, req.user!.id));`);

fs.writeFileSync('server.ts', code);
