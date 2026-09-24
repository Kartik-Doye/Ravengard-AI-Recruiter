import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { candidates } from "../db/schema";
import { db } from "../db/client";
import { AuthRequest } from "./auth";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "REPLACE_ME_run_node_console.log(require('crypto').randomBytes(32).toString('hex'))") {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("FATAL: JWT_SECRET must be set in production environment");
  }
}
const ACTUAL_SECRET = JWT_SECRET || "ravengard_dev_jwt_secret_change_in_production";

export interface AuthTraditionalRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    email_verified?: boolean;
  };
}

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
      email_verified?: boolean;
    };

    // Verify the user exists in the database
    const user = await db.query(candidates).findFirst({
      where: (col) => col.id === decoded.id && col.email === decoded.email,
    });

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      email_verified: decoded.email_verified ?? false,
    };

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

export const signCandidateToken = (payload: {
  id: string;
  email: string;
  name?: string;
  email_verified?: boolean;
}): string => {
  return jwt.sign(payload, ACTUAL_SECRET, { expiresIn: "24h" });
};

export const signAdminToken = (payload: {
  id: string;
  email: string;
  role: string;
  organizationId?: string | null;
}): string => {
  return jwt.sign({ ...payload, isAdmin: true }, ACTUAL_SECRET, { expiresIn: "8h" });
};