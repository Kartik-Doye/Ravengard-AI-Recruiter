const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf8');

if (!file.includes('correlationIdMiddleware')) {
  file = file.replace('import { requireAuth, AuthRequest } from "./src/middleware/auth";', 'import { requireAuth, AuthRequest } from "./src/middleware/auth";\nimport { correlationIdMiddleware } from "./src/middleware/correlationId";\nimport { adminLimiter } from "./src/middleware/adminRateLimit";');
  
  file = file.replace('const app = express();\n  app.set("trust proxy", 1);', 'const app = express();\n  app.set("trust proxy", 1);\n  app.use(correlationIdMiddleware);');
}

// Remove the inline adminLimiter
const limiterStart = file.indexOf('const adminLimiter = rateLimit({');
const limiterEnd = file.indexOf('});\n', limiterStart) + 4;
if (limiterStart !== -1 && limiterEnd !== -1) {
  file = file.substring(0, limiterStart) + file.substring(limiterEnd);
}

fs.writeFileSync('server.ts', file);
