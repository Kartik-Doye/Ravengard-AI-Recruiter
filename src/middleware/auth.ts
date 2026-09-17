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
  req.user = { 
    id: token, 
    // We append a domain just so it's a valid email structure, 
    // but in server.ts we should be querying by ID where possible, 
    // or just let it use this mocked email.
    email: `${token}@mock.local`, 
    name: "Mock User",
    email_verified: true
  };
  
  return next();
};
