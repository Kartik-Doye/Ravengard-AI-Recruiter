import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    email_verified?: boolean;
    role?: string;
    organizationId?: string | null;
  };
  principal?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string | null;
  };
  admin?: {
    id: string;
    role: string;
    organizationId?: string | null;
  };
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "REPLACE_ME_run_node_console.log(require('crypto').randomBytes(32).toString('hex'))") {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("FATAL: JWT_SECRET must be set in production environment");
  }
}
const ACTUAL_SECRET = JWT_SECRET || "ravengard_dev_jwt_secret_change_in_production";

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, ACTUAL_SECRET) as {
      id: string;
      email: string;
      name?: string;
      role?: string;
      organizationId?: string | null;
      email_verified?: boolean;
      isAdmin?: boolean;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      email_verified: decoded.email_verified ?? false,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };

    req.principal = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || (decoded.isAdmin ? "super_admin" : "candidate"),
      organizationId: decoded.organizationId,
    };

    if (decoded.isAdmin) {
      req.admin = {
        id: decoded.id,
        role: decoded.role || "super_admin",
        organizationId: decoded.organizationId,
      };
    }

    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Unauthorized: Token expired. Please log in again." });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Unauthorized: Invalid token." });
    }
    console.error("Auth middleware unexpected error:", err);
    return res.status(500).json({ error: "Internal Server Error during authentication." });
  }
};

/**
 * Normalizes user roles for permission matching.
 * Maps 'admin', 'ADMIN', 'super_admin' to 'super_admin'.
 * Maps 'hr', 'hr_admin', 'HR', 'hr_manager', 'hiring_manager' to 'hr_manager'.
 */
export function normalizeRole(role: string): string {
  const r = (role || "").toLowerCase().trim();
  if (r === "admin" || r === "super_admin" || r === "platform_operator") return "super_admin";
  if (r === "hr_manager" || r === "hr_admin" || r === "hr" || r === "hiring_manager") return "hr_manager";
  if (r === "recruiter" || r === "hr_user") return "recruiter";
  return r;
}

/**
 * Role-based access control middleware.
 * Can be called as requireRole(["hr_manager", "recruiter"]) or requireRole("super_admin").
 */
export function requireRole(allowedRoles: string[] | string, ...rest: string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles, ...rest];
  const normalizedAllowed = roles.map(r => normalizeRole(r));

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const rawRole = req.principal?.role || req.user?.role || req.admin?.role;

    if (!rawRole) {
      return res.status(403).json({
        error: "403 Forbidden: You do not have permission to access this portal section.",
      });
    }

    const userNormalized = normalizeRole(rawRole);

    const matches = roles.includes(rawRole) ||
      normalizedAllowed.includes(userNormalized) ||
      (normalizedAllowed.includes("hr_manager") && userNormalized === "recruiter") ||
      (normalizedAllowed.includes("recruiter") && userNormalized === "hr_manager");

    if (!matches) {
      return res.status(403).json({
        error: "403 Forbidden: You do not have permission to access this portal section.",
        required: roles,
        providedRole: rawRole,
      });
    }

    next();
  };
}

/**
 * Signs a candidate JWT token.
 * Expires in 24 hours.
 */
export const signCandidateToken = (payload: {
  id: string;
  email: string;
  name?: string;
  email_verified?: boolean;
}): string => {
  return jwt.sign(payload, ACTUAL_SECRET, { expiresIn: "24h" });
};

/**
 * Signs an admin JWT token.
 * Expires in 8 hours.
 * Admin tokens carry a 'role' and 'isAdmin: true' claim.
 */
export const signAdminToken = (payload: {
  id: string;
  email: string;
  role: string;
  organizationId?: string | null;
}): string => {
  return jwt.sign({ ...payload, isAdmin: true }, ACTUAL_SECRET, { expiresIn: "8h" });
};
