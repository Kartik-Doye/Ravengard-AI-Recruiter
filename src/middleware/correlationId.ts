import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const id = req.headers["x-request-id"] as string | undefined || crypto.randomUUID();
  res.setHeader("X-Request-Id", id);
  (req as any).requestId = id;
  next();
}
