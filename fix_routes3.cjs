const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/app\.post\("\/api\/session\/:id\/upload-resume", requireAuth, upload\.single\('resume'\), async \(req, res\) =>/g, 'app.post("/api/session/:id/upload-resume", requireAuth, upload.single(\'resume\'), async (req: AuthRequest, res) =>');
code = code.replace(/app\.get\("\/api\/session\/:id\/resume-analysis", requireAuth, async \(req, res\) =>/g, 'app.get("/api/session/:id/resume-analysis", requireAuth, async (req: AuthRequest, res) =>');
code = code.replace(/app\.post\("\/api\/session\/:id\/stage", requireAuth, async \(req, res\) =>/g, 'app.post("/api/session/:id/stage", requireAuth, async (req: AuthRequest, res) =>');
code = code.replace(/app\.post\("\/api\/interview\/instructions\/confirm", requireAuth, async \(req, res\) =>/g, 'app.post("/api/interview/instructions/confirm", requireAuth, async (req: AuthRequest, res) =>');
code = code.replace(/app\.post\("\/api\/device-check\/save", requireAuth, async \(req, res\) =>/g, 'app.post("/api/device-check/save", requireAuth, async (req: AuthRequest, res) =>');
code = code.replace(/app\.post\("\/api\/device-check\/validate", requireAuth, async \(req, res\) =>/g, 'app.post("/api/device-check/validate", requireAuth, async (req: AuthRequest, res) =>');
code = code.replace(/app\.post\("\/api\/interview\/readiness\/confirm", requireAuth, async \(req, res\) =>/g, 'app.post("/api/interview/readiness/confirm", requireAuth, async (req: AuthRequest, res) =>');
code = code.replace(/app\.post\("\/api\/session\/:id\/request-retake", requireAuth, async \(req, res\) =>/g, 'app.post("/api/session/:id/request-retake", requireAuth, async (req: AuthRequest, res) =>');
code = code.replace(/app\.post\("\/api\/session\/:id\/think-again", requireAuth, async \(req, res\) =>/g, 'app.post("/api/session/:id/think-again", requireAuth, async (req: AuthRequest, res) =>');
code = code.replace(/app\.post\("\/api\/interview\/:id\/start", requireAuth, async \(req, res\)/g, 'app.post("/api/interview/:id/start", requireAuth, async (req: AuthRequest, res)');
code = code.replace(/app\.get\("\/api\/interview\/:id\/stream-question", requireAuth, async \(req, res\)/g, 'app.get("/api/interview/:id/stream-question", requireAuth, async (req: AuthRequest, res)');
code = code.replace(/app\.post\("\/api\/interview\/:id\/answer", requireAuth, async \(req, res\)/g, 'app.post("/api/interview/:id/answer", requireAuth, async (req: AuthRequest, res)');
code = code.replace(/app\.post\("\/api\/interview\/:id\/signal", requireAuth, async \(req, res\)/g, 'app.post("/api/interview/:id/signal", requireAuth, async (req: AuthRequest, res)');
code = code.replace(/app\.post\("\/api\/interview\/:id\/generate-report", requireAuth, async \(req, res\)/g, 'app.post("/api/interview/:id/generate-report", requireAuth, async (req: AuthRequest, res)');
code = code.replace(/app\.get\("\/api\/interview\/:id\/report", requireAuth, async \(req, res\)/g, 'app.get("/api/interview/:id/report", requireAuth, async (req: AuthRequest, res)');

fs.writeFileSync('server.ts', code);
