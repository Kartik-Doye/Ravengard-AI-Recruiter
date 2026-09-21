import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { db } from "../db/index";
import { apiKeys } from "../db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { logger } from "../lib/logger";

export interface ApiKeyRequest extends Request {
  apiKey?: {
    id: string;
    organizationId: string;
    name: string;
    scopes: string[];
  };
}

/**
 * Middleware to authenticate tenant-scoped API keys (format: rg_live_...).
 */
export async function requireApiKeyAuth(
  req: ApiKeyRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : (req.headers["x-api-key"] as string | undefined)?.trim();

  if (!token || !token.startsWith("rg_live_")) {
    return res.status(401).json({
      error: "Unauthorized: Missing or invalid API key format. Expected Bearer rg_live_...",
    });
  }

  try {
    const keyHash = crypto.createHash("sha256").update(token).digest("hex");

    const [keyRecord] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
      .limit(1);

    if (!keyRecord) {
      logger.warn("API key authentication failed: hash not found or revoked", {
        prefix: token.substring(0, 16),
      });
      return res.status(401).json({ error: "Unauthorized: Invalid or revoked API key." });
    }

    // Fire-and-forget: update lastUsedAt
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyRecord.id))
      .catch((err) => {
        logger.error("Failed to update API key lastUsedAt", { error: err.message });
      });

    req.apiKey = {
      id: keyRecord.id,
      organizationId: keyRecord.organizationId,
      name: keyRecord.name,
      scopes: (keyRecord.scopes as string[]) || [],
    };

    next();
  } catch (err: any) {
    logger.error("Error verifying API key", { error: err.message });
    return res.status(500).json({ error: "Internal server error during authentication." });
  }
}
