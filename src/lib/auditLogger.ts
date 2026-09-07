import { db } from "../db/index";
import { adminLogs } from "../db/schema";
import crypto from "crypto";

export async function logAdminAction(params: {
  adminId: string;
  role?: string;
  action: string;
  target?: string;
  metadata?: Record<string, any>;
  requestId?: string;
  ip?: string;
}) {
  try {
    await db.insert(adminLogs).values({
      id: crypto.randomUUID(),
      adminId: params.adminId,
      action: params.action,
      target: params.target || null,
      metadata: {
        ...params.metadata,
        role: params.role,
        requestId: params.requestId,
        ip: params.ip
      }
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}
