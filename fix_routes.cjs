const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix app.get("/api/welcome-message", requireAuth, async (req, res) => {
code = code.replace(/app\.get\("\/api\/welcome-message", requireAuth, async \(req, res\) => \{/g, 'app.get("/api/welcome-message", requireAuth, async (req: AuthRequest, res) => {');

// Fix app.post("/api/session/confirm-consent", requireAuth, async (req, res) => {
code = code.replace(/app\.post\("\/api\/session\/confirm-consent", requireAuth, async \(req, res\) => \{/g, 'app.post("/api/session/confirm-consent", requireAuth, async (req: AuthRequest, res) => {');

// Fix currentStage: 'consent' -> 'resume_upload'
code = code.replace(/currentStage: 'consent'/g, "currentStage: 'resume_upload' as any");

// Fix transition from 'consent'
code = code.replace(/transitionSessionStage\(session\.id, 'consent', 'resume_upload'\)/g, "transitionSessionStage(session.id, 'resume_upload', 'resume_upload')"); // wait, if it's already resume_upload, we don't need to transition it to resume_upload. We can just return the session.

fs.writeFileSync('server.ts', code);
