import { Request, Response } from "express";
import { db } from "../../../db/index";
import { integrationConfigs, organizations } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import {
  verifyWebhookSignature,
  handleGreenhouseWebhook,
  handleLeverWebhook,
  handleWorkdayWebhook,
} from "../../../lib/integrations/webhooks";
import { logger } from "../../../lib/logger";

/**
 * Inbound ATS Webhook Handler for Greenhouse, Lever, and Workday.
 * Route: POST /api/v1/integrations/webhooks/:provider
 */
export async function inboundWebhookHandler(req: Request, res: Response) {
  const provider = (req.params.provider || "").toLowerCase();
  const allowedProviders = ["greenhouse", "lever", "workday"];

  if (!allowedProviders.includes(provider)) {
    return res.status(400).json({
      error: `Unsupported ATS provider '${provider}'. Allowed: ${allowedProviders.join(", ")}`,
    });
  }

  // 1. Check for sandbox bypass header
  const isSandboxRequested = req.headers["x-ravengard-sandbox"] === "true";
  const isSandboxAllowed =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_SANDBOX_WEBHOOKS === "true";

  // 2. Organization detection: from header, query param, or fallback to primary default org
  const orgId =
    (req.headers["x-organization-id"] as string) ||
    (req.query.orgId as string) ||
    "org-ravengard";

  // 3. Signature verification
  if (!isSandboxRequested || !isSandboxAllowed) {
    // Look up integration secret from DB
    const [config] = await db
      .select()
      .from(integrationConfigs)
      .where(
        and(
          eq(integrationConfigs.organizationId, orgId),
          eq(integrationConfigs.provider, provider)
        )
      )
      .limit(1);

    const secret =
      config?.webhookSecret ||
      process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`] ||
      "";

    let signatureHeader: string | undefined;
    if (provider === "greenhouse") {
      signatureHeader = (req.headers["greenhouse-signature"] ||
        req.headers["signature"]) as string;
    } else if (provider === "lever") {
      signatureHeader = (req.headers["x-lever-signature"] ||
        req.headers["signature"]) as string;
    } else if (provider === "workday") {
      signatureHeader = (req.headers["x-workday-signature"] ||
        req.headers["signature"]) as string;
    }

    const rawBody =
      typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body || {});

    // In production, signature verification is strictly non-negotiable
    if (process.env.NODE_ENV === "production" || !isSandboxAllowed) {
      if (!signatureHeader || !secret) {
        logger.warn("Inbound webhook rejected: missing signature or unconfigured secret", {
          provider,
          orgId,
          hasSignatureHeader: !!signatureHeader,
          hasSecret: !!secret,
        });
        return res.status(401).json({
          error: "Unauthorized: Missing webhook signature or unconfigured integration secret.",
        });
      }

      const isValid = verifyWebhookSignature(rawBody, signatureHeader, secret);
      if (!isValid) {
        logger.warn("Inbound webhook signature verification failed", {
          provider,
          orgId,
        });
        return res.status(401).json({
          error: "Unauthorized: Invalid cryptographic signature.",
        });
      }
    }
  }

  // 4. Dispatch to provider handler
  try {
    let result;
    const payload = req.body || {};

    if (provider === "greenhouse") {
      result = await handleGreenhouseWebhook(payload, orgId);
    } else if (provider === "lever") {
      result = await handleLeverWebhook(payload, orgId);
    } else {
      result = await handleWorkdayWebhook(payload, orgId);
    }

    return res.status(result.status).json(result);
  } catch (error: any) {
    logger.error("Unhandled webhook processing exception", {
      provider,
      orgId,
      error: error.message,
    });
    return res.status(500).json({
      error: `Failed to process ${provider} webhook payload: ${error.message}`,
    });
  }
}
