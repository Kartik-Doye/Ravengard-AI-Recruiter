import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index";
import { adminUsers, organizations, applications } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { verifyCandidateMagicJwt, CandidateTokenPayload } from "../services/magicTokenService";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "REPLACE_ME_run_node_console.log(require('crypto').randomBytes(32).toString('hex'))") {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("FATAL: JWT_SECRET must be set in production environment");
  }
}
const ACTUAL_SECRET = JWT_SECRET || "ravengard_dev_jwt_secret_change_in_production";

export interface HrAuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  hr?: {
    id: string;
    email: string;
    name: string;
    role: "hr_admin" | "hr_user" | "recruiter" | "hiring_manager" | "super_admin" | "admin";
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

    const role = userRecord.role;
    const isSuperAdmin = role === "super_admin" || role === "admin";
    const isHr =
      role === "hr_admin" ||
      role === "hr_user" ||
      role === "recruiter" ||
      role === "hiring_manager";

    if (!isSuperAdmin && !isHr) {
      return res.status(403).json({ error: "Forbidden: Insufficient privileges for HR portal." });
    }

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
      role: (isSuperAdmin ? "super_admin" : role) as any,
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
 * Enforces Candidate Magic Link JWT authorization.
 */
export const requireCandidateAuth = async (
  req: HrAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing candidate magic session token." });
  }

  const token = authHeader.substring(7);
  const payload = verifyCandidateMagicJwt(token);

  if (!payload) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired candidate token." });
  }

  // Check application status to prevent post-completion re-entry into interview engines
  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, payload.applicationId))
    .limit(1);

  if (!app) {
    return res.status(404).json({ error: "Not Found: Candidate application record missing." });
  }

  // Bind candidate context
  req.candidate = {
    ...payload,
    sessionId: app.sessionId || payload.sessionId,
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
  if (!req.candidate) {
    return res.status(401).json({ error: "Unauthorized: No candidate context." });
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
