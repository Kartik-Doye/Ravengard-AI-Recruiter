import crypto from "crypto";
import { db } from "../../db/index";
import { candidates, applications, jobs, screeningQueue, integrationConfigs } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../logger";

export interface WebhookResult {
  success: boolean;
  status: number;
  message: string;
  data?: {
    applicationId?: string;
    candidateId?: string;
    candidateEmail?: string;
    provider: string;
    action?: string;
  };
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const cleanSig = signatureHeader.replace(/^sha256=/, "");
    const sigBuffer = Buffer.from(cleanSig, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (err) {
    return false;
  }
}

export async function handleGreenhouseWebhook(
  payload: any,
  orgId: string
): Promise<WebhookResult> {
  const action = payload.action || payload.event;
  if (action === "ping") {
    return { success: true, status: 200, message: "Greenhouse ping verified." };
  }

  const candidateData = payload.payload?.candidate || payload.candidate || {};
  const applicationData = payload.payload?.application || payload.application || {};
  const jobData = payload.payload?.job || payload.job || {};

  const email = (candidateData.email_addresses?.[0]?.value || candidateData.email || "").trim().toLowerCase();
  const name = [candidateData.first_name, candidateData.last_name].filter(Boolean).join(" ") || candidateData.name || "Greenhouse Candidate";
  const externalJobId = String(jobData.id || applicationData.job_id || "");

  if (!email) {
    return { success: false, status: 400, message: "Greenhouse payload missing candidate email." };
  }

  return await ingestCandidateApplication({
    email,
    name,
    organizationId: orgId,
    externalJobId,
    provider: "greenhouse",
    action: action || "stage_change",
    sourcePayload: payload,
  });
}

export async function handleLeverWebhook(
  payload: any,
  orgId: string
): Promise<WebhookResult> {
  const eventType = payload.type || payload.event;
  if (eventType === "ping") {
    return { success: true, status: 200, message: "Lever ping verified." };
  }

  const candidateData = payload.data?.candidate || payload.candidate || payload.data || {};
  const email = (candidateData.emails?.[0] || candidateData.email || "").trim().toLowerCase();
  const name = candidateData.name || "Lever Candidate";
  const externalJobId = String(candidateData.postings?.[0] || candidateData.postingId || "");

  if (!email) {
    return { success: false, status: 400, message: "Lever payload missing candidate email." };
  }

  return await ingestCandidateApplication({
    email,
    name,
    organizationId: orgId,
    externalJobId,
    provider: "lever",
    action: eventType || "candidate_update",
    sourcePayload: payload,
  });
}

export async function handleWorkdayWebhook(
  payload: any,
  orgId: string
): Promise<WebhookResult> {
  const event = payload.Event_Type || payload.event || "Application_Status_Change";
  const email = (payload.Candidate_Email || payload.email || "").trim().toLowerCase();
  const name = payload.Candidate_Name || payload.name || "Workday Candidate";
  const externalJobId = String(payload.Job_Requisition_ID || payload.jobId || "");

  if (!email) {
    return { success: false, status: 400, message: "Workday payload missing candidate email." };
  }

  return await ingestCandidateApplication({
    email,
    name,
    organizationId: orgId,
    externalJobId,
    provider: "workday",
    action: event,
    sourcePayload: payload,
  });
}

export async function ingestCandidateApplication(params: {
  email: string;
  name: string;
  organizationId: string;
  externalJobId: string;
  provider: "greenhouse" | "lever" | "workday";
  action: string;
  sourcePayload: any;
}): Promise<WebhookResult> {
  const { email, name, organizationId, externalJobId, provider, action } = params;

  try {
    let [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.email, email))
      .limit(1);

    if (!candidate) {
      const newCandId = `cand-${crypto.randomUUID()}`;
      await db.insert(candidates).values({
        id: newCandId,
        email,
        name,
        emailVerified: true,
        organizationId,
      });
      [candidate] = await db.select().from(candidates).where(eq(candidates.id, newCandId)).limit(1);
    }

    let [targetJob] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.organizationId, organizationId), eq(jobs.status, "published")))
      .limit(1);

    if (!targetJob) {
      const fallbackJobId = `job-ats-${crypto.randomUUID()}`;
      await db.insert(jobs).values({
        id: fallbackJobId,
        organizationId,
        title: "Senior Full Stack Systems Engineer",
        department: "Engineering",
        description: "Primary technical track synchronized from external ATS.",
        screeningThreshold: 70,
        requireHumanRejectionApproval: true,
        status: "published",
      });
      [targetJob] = await db.select().from(jobs).where(eq(jobs.id, fallbackJobId)).limit(1);
    }

    let [application] = await db
      .select()
      .from(applications)
      .where(and(eq(applications.candidateId, candidate.id), eq(applications.jobId, targetJob.id)))
      .limit(1);

    let isNewApp = false;
    if (!application) {
      isNewApp = true;
      const appId = `app-${crypto.randomUUID()}`;
      await db.insert(applications).values({
        id: appId,
        candidateId: candidate.id,
        jobId: targetJob.id,
        organizationId,
        status: "applied",
      });
      [application] = await db.select().from(applications).where(eq(applications.id, appId)).limit(1);
    }

    if (isNewApp || application.status === "applied") {
      const [existingQueue] = await db
        .select()
        .from(screeningQueue)
        .where(eq(screeningQueue.applicationId, application.id))
        .limit(1);

      if (!existingQueue) {
        await db.insert(screeningQueue).values({
          id: `sq-${crypto.randomUUID()}`,
          applicationId: application.id,
          organizationId,
          status: "pending",
        });
      }
    }

    logger.info("ATS webhook successfully ingested candidate application", {
      organizationId,
      provider,
      action,
      candidateEmail: email,
      candidateId: candidate.id,
      applicationId: application.id,
    });

    return {
      success: true,
      status: isNewApp ? 201 : 200,
      message: `Candidate application successfully ${isNewApp ? "created and enqueued" : "synchronized"} from ${provider}.`,
      data: {
        applicationId: application.id,
        candidateId: candidate.id,
        candidateEmail: email,
        provider,
        action,
      },
    };
  } catch (error: any) {
    logger.error("Failed to ingest ATS webhook application", {
      error: error.message,
      stack: error.stack,
      provider,
      organizationId,
      candidateEmail: email,
    });

    return {
      success: false,
      status: 500,
      message: `Internal error processing ${provider} webhook: ${error.message}`,
    };
  }
}
