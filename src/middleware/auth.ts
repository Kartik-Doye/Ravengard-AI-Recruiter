import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import { candidates } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: { uid: string, email?: string, admin?: boolean, candidateId?: number };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.uid, token));
    
    req.user = { 
      uid: token, 
      email: candidate?.email || '',
      admin: candidate?.isAdmin || false,
      candidateId: candidate?.id
    };
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
