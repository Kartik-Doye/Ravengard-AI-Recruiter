const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  '  app.get("/api/admin/stuck-sessions", async (req, res) => {',
  `  app.get("/api/admin/stuck-sessions", requireAuth, async (req, res) => {
    // @ts-ignore
    const email = req.user.email;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }`
);

fs.writeFileSync('server.ts', code);
