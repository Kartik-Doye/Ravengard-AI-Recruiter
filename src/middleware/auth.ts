import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Stub for requireAuth middleware
  // We'll bypass auth for now or use a dummy user
  req.user = { id: "test-user-id", email: "test@example.com", name: "Test User" };
  next();
};
