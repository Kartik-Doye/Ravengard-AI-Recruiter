const fs = require('fs');
let file = fs.readFileSync('server.ts', 'utf8');

if (!file.includes('adminRoutes')) {
  // Add import
  file = file.replace('import { registrationSchema } from "./src/lib/validation";', 'import { registrationSchema } from "./src/lib/validation";\nimport adminRoutes from "./src/routes/admin";');
  
  // Mount the routes below adminLimiter
  file = file.replace('app.use("/api/admin", adminLimiter);', 'app.use("/api/admin", adminLimiter);\napp.use("/api/admin", adminRoutes);');
  
  fs.writeFileSync('server.ts', file);
}
