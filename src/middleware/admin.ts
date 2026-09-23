import type { Response, NextFunction } from "express";
import { AuthRequest, normalizeRole } from "./auth";
import { db } from "../db/index";
import { adminUsers } from "../db/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export type AdminRole = "admin" | "reviewer" | "viewer" | "super_admin" | "hr_admin" | "hr_user" | "recruiter" | "hiring_manager" | "HR" | "ADMIN";

export interface AdminAuthRequest extends AuthRequest {
  admin?: {
    id: string;
    role: AdminRole;
  };
}

/**
 * Verifies that the bearer token is an admin JWT and that the user
 * exists in admin_users table. Must be called AFTER requireAuth.
 *
 * Permission matrix (from AGENTS.md / handoff spec):
 *   admin    — full access: read + update flags + update status + manage users
 *   reviewer — read + update flags + update status
 *   viewer   — read-only
 *
 * Individual routes enforce specific role minimums via requireRole().
 */
export const authAdmin = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.email) {
    return res.status(401).json({ error: "Unauthorized: Missing user context" });
  }

  // Verify admin claim in JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.substring(7);
  const JWT_SECRET = process.env.JWT_SECRET || "ravengard_dev_jwt_secret_change_in_production";

  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired admin token." });
  }

  if (!decoded.isAdmin) {
    return res.status(403).json({ error: "Forbidden: Not an admin token." });
  }

  try {
    const [adminRecord] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, req.user.email))
      .limit(1);

    if (!adminRecord) {
      // Fallback for root admin if session matches root email
      if (req.user.email === 'admin@ravengard.com') {
        req.admin = {
          id: 'admin-root',
          role: 'admin',
        };
        return next();
      }
      return res.status(403).json({ error: "Forbidden: Not an admin account." });
    }

    const validRoles: AdminRole[] = [
      "admin",
      "super_admin",
      "hr_admin",
      "hr_user",
      "recruiter",
      "hiring_manager",
      "reviewer",
      "viewer",
      "HR",
      "ADMIN",
    ];
    if (!validRoles.includes(adminRecord.role as AdminRole)) {
      return res.status(403).json({ error: "Forbidden: Unknown admin role." });
    }

    req.admin = {
      id: adminRecord.id,
      role: adminRecord.role as AdminRole,
    };

    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    return res.status(500).json({ error: "Internal Server Error during admin verification." });
  }
};

/**
 * Route-level role guard. Use after authAdmin.
 * Example: router.post('/sessions/:id/flag', requireRole('reviewer'), handler)
 *
 * Role hierarchy: admin > reviewer > viewer
 * Supports role normalization (e.g. 'ADMIN' -> 'super_admin').
 */
export const requireRole = (...allowedRoles: AdminRole[]) => {
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));

  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: "Unauthorized: No admin context." });
    }

    const userNormalized = normalizeRole(req.admin.role);

    const matches = allowedRoles.includes(req.admin.role) ||
      normalizedAllowed.includes(userNormalized) ||
      (normalizedAllowed.includes("hr_manager") && userNormalized === "recruiter") ||
      (normalizedAllowed.includes("recruiter") && userNormalized === "hr_manager") ||
      (userNormalized === "super_admin"); // Super admin bypass

    if (!matches) {
      return res.status(403).json({
        error: `Forbidden: This action requires one of: [${allowedRoles.join(", ")}]. Your role: ${req.admin.role}.`,
      });
    }
    next();
  };
};
