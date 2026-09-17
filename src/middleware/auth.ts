import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    email_verified?: boolean;
  };
}

const JWT_SECRET = process.env.JWT_SECRET;

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!JWT_SECRET) {
    console.error("FATAL: JWT_SECRET is not set in environment variables.");
    return res.status(500).json({ error: "Server misconfiguration: auth secret missing." });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      name?: string;
      email_verified?: boolean;
    };

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
  if (!JWT_SECRET) throw new Error("JWT_SECRET not set");
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
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
}): string => {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not set");
  return jwt.sign({ ...payload, isAdmin: true }, JWT_SECRET, { expiresIn: "8h" });
};
