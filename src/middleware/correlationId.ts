import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function extractClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded && typeof forwarded === "string") {
    return forwarded.split(",")[0].trim().replace(/^::ffff:/, "");
  }
  const realIp = req.headers["x-real-ip"];
  if (realIp && typeof realIp === "string") {
    return realIp.trim().replace(/^::ffff:/, "");
  }
  return (req.socket?.remoteAddress || "127.0.0.1").replace(/^::ffff:/, "").trim();
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const id = (req.headers["x-request-id"] as string | undefined) || crypto.randomUUID();
  res.setHeader("X-Request-Id", id);
  (req as any).requestId = id;
  (req as any).clientIp = extractClientIp(req);
  next();
}
