import { db } from "../db/index";
import { outboxEvents, integrationConfigs } from "../db/schema";
import { eq, and, lte, inArray, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

export interface OutboxScorecardPayload {
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  jobId: string;
  applicationId: string;
  scorecard: {
    overallScore: number;
    recommendation: "strong_hire" | "hire" | "weak_hire" | "no_hire";
    technicalScore: number;
    communicationScore: number;
    behavioralScore: number;
    strengths: string[];
    weaknesses: string[];
  };
  pdfUrl?: string;
  completedAt: string;
}

export async function queueScorecardExport(params: {
  organizationId: string;
  applicationId: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  jobId: string;
  scorecard: any;
  pdfUrl?: string;
}): Promise<string> {
  const eventId = `outbox-${crypto.randomUUID()}`;
  const payload: OutboxScorecardPayload = {
    candidateId: params.candidateId,
    candidateEmail: params.candidateEmail,
    candidateName: params.candidateName,
    jobId: params.jobId,
    applicationId: params.applicationId,
    scorecard: params.scorecard,
    pdfUrl: params.pdfUrl,
    completedAt: new Date().toISOString(),
  };

  await db.insert(outboxEvents).values({
    id: eventId,
    organizationId: params.organizationId,
    eventType: "ATS_EXPORT_CANDIDATE_SCORECARD",
    payload,
    status: "pending",
    retryCount: 0,
    maxRetries: 5,
    nextRetryAt: new Date(),
  });

  logger.info("Enqueued ATS scorecard export event to transactional outbox", {
    eventId,
    organizationId: params.organizationId,
    candidateId: params.candidateId,
    applicationId: params.applicationId,
  });

  return eventId;
}

export async function processOutboxBatch(batchSize = 5): Promise<number> {
  const now = new Date();

  // Pick pending or failed events ready for retry
  const pendingEvents = await db
    .select()
    .from(outboxEvents)
    .where(
      and(
        inArray(outboxEvents.status, ["pending", "failed"]),
        lte(outboxEvents.nextRetryAt, now)
      )
    )
    .limit(batchSize);

  if (pendingEvents.length === 0) return 0;

  let processedCount = 0;

  for (const event of pendingEvents) {
    try {
      // Mark as processing
      await db
        .update(outboxEvents)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(outboxEvents.id, event.id));

      const payload = event.payload as OutboxScorecardPayload;
      
      // Look up configured ATS integrations for this organization
      const configs = await db
        .select()
        .from(integrationConfigs)
        .where(
          and(
            eq(integrationConfigs.organizationId, event.organizationId),
            eq(integrationConfigs.isEnabled, true)
          )
        );

      if (configs.length === 0) {
        // Log development mock sync if no external provider credentials configured
        logger.info("Outbox ATS export: No external ATS configured for tenant, recorded as synced", {
          eventId: event.id,
          organizationId: event.organizationId,
          candidateEmail: payload.candidateEmail,
        });

        await db
          .update(outboxEvents)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(outboxEvents.id, event.id));
        processedCount++;
        continue;
      }

      // Execute dispatch for each configured provider
      for (const config of configs) {
        if (config.apiEndpoint) {
          const res = await fetch(config.apiEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Ravengard-Outbox-Worker/1.0",
              "X-Ravengard-Event": event.eventType,
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            throw new Error(`ATS endpoint responded with status ${res.status}`);
          }
        }
      }

      await db
        .update(outboxEvents)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(outboxEvents.id, event.id));

      processedCount++;
    } catch (err: any) {
      const nextRetryCount = event.retryCount + 1;
      const isExhausted = nextRetryCount >= event.maxRetries;
      // Exponential backoff: 5s, 30s, 2m, 8m, 15m
      const backoffSecs = Math.min(5 * Math.pow(4, nextRetryCount - 1), 900);
      const nextRetry = new Date(Date.now() + backoffSecs * 1000);

      logger.warn("Outbox ATS export event failed, scheduled retry", {
        eventId: event.id,
        retryCount: nextRetryCount,
        maxRetries: event.maxRetries,
        nextRetryAt: nextRetry.toISOString(),
        error: err.message,
      });

      await db
        .update(outboxEvents)
        .set({
          status: isExhausted ? "failed" : "pending",
          retryCount: nextRetryCount,
          nextRetryAt: nextRetry,
          lastError: err.message,
          updatedAt: new Date(),
        })
        .where(eq(outboxEvents.id, event.id));
    }
  }

  return processedCount;
}
