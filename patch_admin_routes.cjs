const fs = require('fs');
let file = fs.readFileSync('src/routes/admin.ts', 'utf8');

file = file.replace('import { logAdminAction } from "../services/adminLogService";', 'import { logAdminAction } from "../lib/auditLogger";');

file = file.replace('await logAdminAction(adminReq.admin!.id, "view_session", `session:${sessionId}`);', 'await logAdminAction({\n      adminId: adminReq.admin!.id,\n      role: adminReq.admin!.role,\n      action: "view_session",\n      target: `session:${sessionId}`,\n      requestId: (req as any).requestId,\n      ip: req.ip\n    });');

file = file.replace('await logAdminAction(adminReq.admin!.id, "update_flag", `session:${sessionId}`, { flagged, flagReason });', 'await logAdminAction({\n      adminId: adminReq.admin!.id,\n      role: adminReq.admin!.role,\n      action: "update_flag",\n      target: `session:${sessionId}`,\n      metadata: { flagged, flagReason },\n      requestId: (req as any).requestId,\n      ip: req.ip\n    });');

file = file.replace('await logAdminAction(adminReq.admin!.id, "update_status", `session:${sessionId}`, { status });', 'await logAdminAction({\n      adminId: adminReq.admin!.id,\n      role: adminReq.admin!.role,\n      action: "update_status",\n      target: `session:${sessionId}`,\n      metadata: { status },\n      requestId: (req as any).requestId,\n      ip: req.ip\n    });');

fs.writeFileSync('src/routes/admin.ts', file);
