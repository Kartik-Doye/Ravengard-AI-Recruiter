import type { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { db } from "../db/index";
import { adminUsers } from "../db/schema";
import { eq } from "drizzle-orm";

export interface AdminAuthRequest extends AuthRequest {
  admin?: {
    id: string;
    role: "admin" | "reviewer" | "viewer";
  };
}

export const authAdmin = async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  // Must be called AFTER requireAuth
  if (!req.user || !req.user.email) {
    return res.status(401).json({ error: "Unauthorized: Missing user context" });
  }

  try {
    const adminRecord = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, req.user.email)
    });

    if (!adminRecord) {
      return res.status(403).json({ error: "Forbidden: Not an admin" });
    }

    if (adminRecord.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admin role required" });
    }

    req.admin = {
      id: adminRecord.id,
      role: adminRecord.role as "admin" | "reviewer" | "viewer"
    };

    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    return res.status(500).json({ error: "Internal Server Error during admin verification" });
  }
};
