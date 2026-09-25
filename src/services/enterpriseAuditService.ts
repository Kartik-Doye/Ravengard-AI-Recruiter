import { db } from "../db/index";
import { auditLogs } from "../db/schema";
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { desc, eq, and, sql } from "drizzle-orm";

export interface AuditRecordParams {
  organizationId?: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  userRole: string;
  userDepartment?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
}

export async function recordAuditEvent(params: AuditRecordParams) {
  try {
    const id = `audit-${crypto.randomUUID().slice(0, 12)}`;
    await db.insert(auditLogs).values({
      id,
      organizationId: params.organizationId || "org-ravengard",
      userId: params.userId || "system",
      userEmail: params.userEmail,
      userName: params.userName || params.userEmail.split("@")[0],
      userRole: params.userRole,
      userDepartment: params.userDepartment || "Engineering",
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      details: params.details || {},
      ipAddress: params.ipAddress || "127.0.0.1",
    });
    return id;
  } catch (err: any) {
    console.error("[Enterprise Audit] Failed to write immutable log:", err.message);
    return null;
  }
}

/**
 * Express Middleware Interceptor: Intercepts mutating requests on HR and Admin planes,
 * generating immutable audit trails for compliance defensibility.
 */
export function enterpriseAuditInterceptor(req: Request, res: Response, next: NextFunction) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return next();
  }

  // Intercept the json response
  const originalJson = res.json.bind(res);
  const startTime = Date.now();

  res.json = function (body: any) {
    const responsePayload = body;
    const clientIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "127.0.0.1").split(",")[0].trim();

    // Only log successful operations
    if (res.statusCode < 400) {
      const hrUser = (req as any).hr;
      const adminUser = (req as any).admin || (req as any).user;
      const actor = hrUser || adminUser;

      if (actor && actor.email) {
        let action = "RESOURCE_MUTATION";
        let resourceType = "system";
        let resourceId = req.params?.id || req.body?.id || "general";

        const path = req.path;
        if (path.includes("/jobs")) {
          resourceType = "job";
          if (path.includes("/approve")) action = "JOB_APPROVAL_STAGE";
          else if (path.includes("/reject")) action = "JOB_REJECTION_REVERT_TO_DRAFT";
          else if (req.method === "POST") action = "JOB_REQUISITION_CREATED";
          else action = "JOB_REQUISITION_UPDATED";
        } else if (path.includes("/applications") || path.includes("/candidate")) {
          resourceType = "application";
          if (path.includes("/status")) action = "CANDIDATE_STATUS_OVERRIDE";
          else if (path.includes("/offer")) action = "OFFER_LETTER_GENERATED";
          else if (path.includes("/telemetry/clear")) action = "TELEMETRY_FLAGS_CLEARED";
          else if (path.includes("/reset-magic-link")) action = "MAGIC_LINK_RESET";
        } else if (path.includes("/rubrics")) {
          resourceType = "rubric";
          action = "RUBRIC_CRITERIA_MODIFIED";
        } else if (path.includes("/calibration")) {
          resourceType = "calibration";
          action = "SHADOW_CALIBRATION_TUNED";
        }

        // Asynchronously persist without delaying response
        recordAuditEvent({
          organizationId: actor.organizationId || "org-ravengard",
          userId: actor.id,
          userEmail: actor.email,
          userName: actor.name,
          userRole: actor.role || "recruiter",
          userDepartment: actor.department || "Engineering",
          action,
          resourceType,
          resourceId,
          details: {
            method: req.method,
            endpoint: req.originalUrl,
            requestBody: sanitizeAuditPayload(req.body),
            durationMs: Date.now() - startTime,
            responseSummary: responsePayload?.success ? "SUCCESS" : "OK",
          },
          ipAddress: clientIp,
        }).catch(() => {});
      }
    }

    return originalJson(responsePayload);
  };

  next();
}

function sanitizeAuditPayload(body: any): any {
  if (!body || typeof body !== "object") return {};
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.token;
  delete sanitized.magicToken;
  delete sanitized.secret;
  return sanitized;
}
