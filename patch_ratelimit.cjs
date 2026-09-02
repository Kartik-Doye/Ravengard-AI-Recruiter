const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf8');

if (!file.includes('express-rate-limit')) {
  // Add import
  file = file.replace('import express, { Request, Response, NextFunction } from "express";', 'import express, { Request, Response, NextFunction } from "express";\nimport rateLimit from "express-rate-limit";');

  // Add the limiters right after `const app = express();`
  const limiters = `
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many admin requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
// We don't apply adminLimiter globally, we'll apply it to a new /api/admin router later, or directly to routes starting with /api/admin.
app.use("/api/admin", adminLimiter);
`;

  file = file.replace('const app = express();', 'const app = express();\n' + limiters);
  fs.writeFileSync('server.ts', file);
}
