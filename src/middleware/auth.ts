import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    email_verified?: boolean;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }
  
  const token = authHeader.substring(7);

  // Mock the auth session completely using the UUID token
  if (token.startsWith('ADMIN_')) {
    req.user = {
      id: token,
      email: 'admin@ravengard.com',
      name: "Admin User",
      email_verified: true
    };
  } else {
    req.user = { 
      id: token, 
      email: `${token}@mock.local`, 
      name: "Mock User",
      email_verified: true
    };
  }
  
  return next();
};
