const fs = require('fs');
let file = fs.readFileSync('src/routes/admin.ts', 'utf8');

file = file.replace('import { requireAdmin, AdminAuthRequest } from "../middleware/admin";', 'import { authAdmin, AdminAuthRequest } from "../middleware/admin";\nimport { logAdminAction } from "../services/adminLogService";');

// Remove the inline logAdminAction definition
const logFuncStart = file.indexOf('// Log utility');
const logFuncEnd = file.indexOf('// Protect all /api/admin routes');
if (logFuncStart !== -1 && logFuncEnd !== -1) {
    file = file.substring(0, logFuncStart) + file.substring(logFuncEnd);
}

file = file.replace('router.use(requireAdmin as any);', 'router.use(authAdmin as any);');

fs.writeFileSync('src/routes/admin.ts', file);
