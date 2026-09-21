import { db } from "../db/index";
import { emailOutbox } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import nodemailer from "nodemailer";
import crypto from "crypto";

export interface QueueEmailParams {
  recipientEmail: string;
  recipientName?: string;
  templateType: "shortlist_invitation" | "assessment_completed" | "non_selection_rejection";
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  applicationId?: string;
  organizationId?: string;
  idempotencyKey?: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;
  private isResendConfigured = false;
  private isSmtpConfigured = false;

  private constructor() {
    const resendKey = process.env.RESEND_API_KEY;
    const smtpUrl = process.env.SMTP_URL;

    if (resendKey && resendKey.trim().length > 0) {
      this.isResendConfigured = true;
      // Resend SMTP endpoint compatibility
      this.transporter = nodemailer.createTransport({
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: {
          user: "resend",
          pass: resendKey.trim(),
        },
        connectionTimeout: 3000,
        greetingTimeout: 3000,
        socketTimeout: 3000,
      });
      console.log("[EmailService] Configured via Resend SMTP transport.");
    } else if (smtpUrl && smtpUrl.trim().length > 0) {
      this.isSmtpConfigured = true;
      this.transporter = nodemailer.createTransport(smtpUrl.trim(), {
        connectionTimeout: 3000,
        greetingTimeout: 3000,
        socketTimeout: 3000,
      });
      console.log("[EmailService] Configured via generic SMTP transport.");
    } else {
      if (process.env.NODE_ENV === "production") {
        console.error(
          "FATAL / CRITICAL WARNING: Neither RESEND_API_KEY nor SMTP_URL configured in production! Candidate emails will fallback to logged_dev outbox state."
        );
      } else {
        console.log(
          "[EmailService] No SMTP/Resend keys detected. Unified fallback engine active (logged_dev mode)."
        );
      }
    }
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Idempotently enqueues an email into the PostgreSQL transactional outbox.
   * Does NOT make external network calls inside caller's transaction.
   */
  public async queueEmail(params: QueueEmailParams): Promise<string> {
    const id = `email-${crypto.randomUUID()}`;
    const idempotencyKey =
      params.idempotencyKey ||
      crypto
        .createHash("sha256")
        .update(`${params.applicationId || "global"}:${params.templateType}:${params.recipientEmail}`)
        .digest("hex");

    try {
      await db
        .insert(emailOutbox)
        .values({
          id,
          recipientEmail: params.recipientEmail,
          recipientName: params.recipientName,
          templateType: params.templateType,
          subject: params.subject,
          bodyText: params.bodyText,
          bodyHtml: params.bodyHtml,
          applicationId: params.applicationId,
          organizationId: params.organizationId,
          idempotencyKey,
          status: "pending",
          attempts: 0,
        })
        .onConflictDoNothing({ target: emailOutbox.idempotencyKey });

      return id;
    } catch (err: any) {
      console.error("[EmailService] Failed to enqueue email into outbox:", err);
      throw err;
    }
  }

  /**
   * Process pending items in email_outbox using PostgreSQL row locking.
   */
  public async processOutboxBatch(batchSize: number = 5): Promise<number> {
    const pool = (db as any).session?.client || (global as any)._postgresPool;
    if (!pool) return 0;

    let processedCount = 0;

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const selectQuery = `
          SELECT * FROM email_outbox
          WHERE status = 'pending' AND attempts < 3
          ORDER BY created_at ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED;
        `;
        const { rows } = await client.query(selectQuery, [batchSize]);

        for (const row of rows) {
          try {
            if (this.transporter && (this.isResendConfigured || this.isSmtpConfigured)) {
              await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || "Ravengard AI Recruiter <hiring@ravengard.com>",
                to: row.recipient_email,
                subject: row.subject,
                text: row.body_text,
                html: row.body_html || undefined,
              });

              await client.query(
                `UPDATE email_outbox 
                 SET status = 'sent', sent_at = now(), attempts = attempts + 1 
                 WHERE id = $1;`,
                [row.id]
              );
              console.log(`[EmailService] Dispatched email ${row.id} to ${row.recipient_email}`);
            } else {
              // Development or unconfigured fallback
              console.log(
                `[EmailService:DEV_OUTBOX] Email ${row.id} -> ${row.recipient_email}\nSubject: ${row.subject}\nBody:\n${row.body_text}\n`
              );

              await client.query(
                `UPDATE email_outbox 
                 SET status = 'logged_dev', sent_at = now(), attempts = attempts + 1 
                 WHERE id = $1;`,
                [row.id]
              );
            }
            processedCount++;
          } catch (sendError: any) {
            console.error(`[EmailService] Delivery error for ${row.id}:`, sendError.message);
            const nextAttempts = row.attempts + 1;
            const newStatus = nextAttempts >= 3 ? "failed" : "pending";
            await client.query(
              `UPDATE email_outbox 
               SET status = $1, attempts = $2, last_error = $3 
               WHERE id = $4;`,
              [newStatus, nextAttempts, sendError.message, row.id]
            );
          }
        }

        await client.query("COMMIT");
      } catch (txnError) {
        await client.query("ROLLBACK");
        throw txnError;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("[EmailService] Outbox processing loop error:", err.message);
    }

    return processedCount;
  }
}

export const emailService = EmailService.getInstance();
