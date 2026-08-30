import type { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { getApps, initializeApp } from "firebase-admin/app";

// Initialize firebase admin for token verification
// This will automatically pick up GOOGLE_APPLICATION_CREDENTIALS if deployed,
// or fallback appropriately. We wrap in a try-catch to prevent crashes 
// during dev/build if credentials aren't present.
if (!getApps().length) {
  try {
    initializeApp();
  } catch (err) {
    console.warn("Firebase Admin initialization warning:", err);
  }
}

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

  // Fallback for the E2E testing environment
  if (process.env.NODE_ENV !== "production" && token.startsWith('test-uid-')) {
    req.user = { 
      id: token, 
      email: `${token}@example.com`, 
      name: "Test User",
      email_verified: true
    };
    return next();
  }

  try {
    // 2. Firebase's own decoded ID token already includes a live email_verified field, 
    // checked via the Admin SDK's verifyIdToken() on the backend.
    const decodedToken = await getAuth().verifyIdToken(token);
    
    req.user = { 
      id: decodedToken.uid, 
      email: decodedToken.email || '', 
      name: decodedToken.name,
      email_verified: decodedToken.email_verified || false
    };
    
    next();
  } catch (error) {
    console.error("Firebase auth error:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid Firebase token" });
  }
};
