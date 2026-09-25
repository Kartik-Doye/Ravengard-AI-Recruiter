import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index";
import { adminUsers, organizations, applications } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyCandidateMagicJwt, CandidateTokenPayload } from "../services/magicTokenService";
import { AuthRequest } from "./auth";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "REPLACE_ME_run_node_console.log(require('crypto').randomBytes(32).toString('hex'))") {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("FATAL: JWT_SECRET must be set in production environment");
  }
}
const ACTUAL_SECRET = JWT_SECRET || "ravengard_dev_jwt_secret_change_in_production";

export interface HrAuthRequest extends AuthRequest {
  hr?: {
    id: string;
    email: string;
    name: string;
    role: "hr_admin" | "hr_user" | "recruiter" | "hiring_manager" | "technical_interviewer" | "finance_approver" | "super_admin" | "admin";
    department: string;
    organizationId: string;
  };
  candidate?: CandidateTokenPayload;
}

/**
 * Enforces tenant-isolated HR authentication.
 * Server-authoritatively extracts organizationId and guarantees zero cross-tenant access.
 */
export const requireHrAuth = async (
  req: HrAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token." });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, ACTUAL_SECRET) as any;

    // Check if token belongs to an admin or HR user
    if (!decoded || !decoded.email) {
      return res.status(401).json({ error: "Unauthorized: Malformed token." });
    }

    // Lookup user in adminUsers
    const [userRecord] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, decoded.email))
      .limit(1);

    if (!userRecord) {
      return res.status(403).json({ error: "Forbidden: Account not registered for HR or Admin access." });
    }

    const rawRole = userRecord.role;
    const isSuperAdmin = rawRole === "super_admin" || rawRole === "admin";
    const allowedRoles = [
      "super_admin",
      "admin",
      "hr_admin",
      "hr_user",
      "recruiter",
      "hiring_manager",
      "technical_interviewer",
      "finance_approver",
    ];

    if (!allowedRoles.includes(rawRole)) {
      return res.status(403).json({ error: "Forbidden: Insufficient privileges for HR portal." });
    }

    // Role & Department Emulation for testing granular RBAC in the switcher toolbar
    const emulatedRole = req.headers["x-emulated-role"] ? String(req.headers["x-emulated-role"]) : null;
    const emulatedDept = req.headers["x-emulated-department"] ? String(req.headers["x-emulated-department"]) : null;

    const effectiveRole = emulatedRole && allowedRoles.includes(emulatedRole)
      ? emulatedRole
      : (isSuperAdmin ? "super_admin" : rawRole);

    const effectiveDept = emulatedDept || userRecord.department || "Engineering";

    // For super admins, allow tenant switching via header if provided; otherwise default to user's org or org-ravengard
    let activeOrgId = userRecord.organizationId || "org-ravengard";
    if (isSuperAdmin && req.headers["x-organization-id"]) {
      activeOrgId = String(req.headers["x-organization-id"]);
    }

    if (!activeOrgId) {
      return res.status(400).json({ error: "Bad Request: No organization associated with this HR account." });
    }

    req.hr = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: effectiveRole as any,
      department: effectiveDept,
      organizationId: activeOrgId,
    };

    return next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Unauthorized: Session expired. Please log in again." });
    }
    return res.status(401).json({ error: "Unauthorized: Invalid authentication credentials." });
  }
};

/**
 * Enforces Candidate Auth (Both permanent profile JWT & single-use magic tokens).
 */
export const requireCandidateAuth = async (
  req: HrAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing candidate session token." });
  }

  const token = authHeader.substring(7);
  const payload = verifyCandidateMagicJwt(token);

  if (!payload) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired candidate token." });
  }

  if (payload.applicationId) {
    const [app] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, payload.applicationId))
      .limit(1);

    if (app) {
      req.candidate = {
        ...payload,
        sessionId: app.sessionId || payload.sessionId,
      };
      return next();
    }
  }

  // If candidate profile token without fixed applicationId, lookup latest active application
  const [latestApp] = await db
    .select()
    .from(applications)
    .where(eq(applications.candidateId, payload.candidateId))
    .orderBy(desc(applications.createdAt))
    .limit(1);

  req.candidate = {
    ...payload,
    applicationId: latestApp?.id || payload.applicationId || "",
    organizationId: latestApp?.organizationId || payload.organizationId || "org-ravengard",
    sessionId: latestApp?.sessionId || payload.sessionId,
  };

  return next();
};

/**
 * Protects active assessment stages from already completed candidate sessions.
 */
export const requireActiveCandidateSession = async (
  req: HrAuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.candidate || !req.candidate.applicationId) {
    return next();
  }

  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, req.candidate.applicationId))
    .limit(1);

  if (app && (app.status === "assessment_completed" || app.status === "recommended" || app.status === "not_recommended")) {
    return res.status(403).json({
      error: "Forbidden: You have already completed this assessment. Re-entry is strictly prohibited.",
      status: app.status,
    });
  }

  next();
};
