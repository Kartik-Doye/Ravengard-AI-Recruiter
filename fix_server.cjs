const fs = require('fs');
let code = fs.readFileSync('/app/applet/server.ts', 'utf8');

code = code.replace(/import \{ users, sessions, resumeParses/g, "import { candidates, sessions, resumeAnalyses");
code = code.replace(/from users/g, "from candidates");
code = code.replace(/users\.email/g, "candidates.email");
code = code.replace(/users\.id/g, "candidates.id");
code = code.replace(/db\.insert\(users\)/g, "db.insert(candidates)");
code = code.replace(/resumeParses/g, "resumeAnalyses");
code = code.replace(/currentPhase/g, "currentStage");

// Fix session locking and creation
const oldPolicyConfirm = `app.post("/api/session/:id/policy-confirm", requireAuth, async (req: AuthRequest, res) => {`;
// Actually, let's just rewrite the /api/session/start and /api/session/:id/policy-confirm
fs.writeFileSync('/app/applet/server.ts', code);
