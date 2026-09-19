import { logAdminAudit } from "../services/adminLogService";

export async function logAdminAction(params: {
  adminId: string;
  role?: string;
  action: string;
  target?: string;
  metadata?: Record<string, any>;
  requestId?: string;
  ip?: string;
}) {
  return logAdminAudit(params);
}
