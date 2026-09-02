import { db } from "../db/index";
import { adminLogs } from "../db/schema";
import crypto from "crypto";

/**
 * Records administrative actions with timestamps and metadata for audit logging purposes.
 */
export async function logAdminAction(adminId: string, action: string, target?: string, metadata?: any) {
  try {
    await db.insert(adminLogs).values({
      id: crypto.randomUUID(),
      adminId,
      action,
      target,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
}
