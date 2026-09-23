import crypto from "crypto";
import { db } from "../db/index";
import { applications, candidates, jobs, sessions } from "../db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ravengard_dev_jwt_secret_change_in_production";

export interface MagicTokenCreationResult {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
  magicLinkUrl: string;
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateMagicToken(appUrl: string = ""): MagicTokenCreationResult {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  const baseUrl = appUrl && appUrl.startsWith("http") ? appUrl : "";
  const magicLinkUrl = `${baseUrl}/candidate/verify?token=${rawToken}`;

  return { rawToken, tokenHash, expiresAt, magicLinkUrl };
}

export interface CandidateTokenPayload {
  candidateId: string;
  applicationId?: string;
  organizationId?: string;
  sessionId?: string;
  role: "candidate";
  email: string;
}

export function signCandidateMagicJwt(payload: CandidateTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "48h" });
}

export function signCandidateProfileJwt(candidate: { id: string; email: string; name?: string | null }): string {
  return jwt.sign(
    {
      id: candidate.id,
      candidateId: candidate.id,
      email: candidate.email,
      name: candidate.name || "",
      role: "candidate",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyCandidateMagicJwt(token: string): CandidateTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as CandidateTokenPayload;
    if (decoded.role !== "candidate") return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Atomically validates and redeems a magic token using PostgreSQL row-level locks.
 * Guarantees single-use even under high concurrent click attempts.
 */
export async function redeemMagicToken(rawToken: string): Promise<{
  success: boolean;
  jwtToken?: string;
  application?: any;
  error?: string;
}> {
  if (!rawToken || rawToken.trim().length === 0) {
    return { success: false, error: "Missing or invalid magic token." };
  }

  const tokenHash = hashToken(rawToken.trim());
  const pool = (db as any).session?.client || (global as any)._postgresPool;
  if (!pool) {
    return { success: false, error: "Database client unavailable." };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Atomically select with row lock
    const checkQuery = `
      SELECT 
        a.id, a.job_id, a.candidate_id, a.organization_id, a.status, a.session_id,
        a.magic_token_hash, a.magic_token_expires_at, a.magic_token_used_at,
        c.email, c.name,
        j.title as job_title, j.screening_threshold
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.magic_token_hash = $1
      FOR UPDATE OF a;
    `;

    const { rows } = await client.query(checkQuery, [tokenHash]);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Invalid or unrecognized magic token." };
    }

    const app = rows[0];

    // Check expiration
    if (new Date() > new Date(app.magic_token_expires_at)) {
      await client.query("ROLLBACK");
      return { success: false, error: "This assessment link has expired (48-hour limit)." };
    }

    // Single use check
    if (app.magic_token_used_at) {
      await client.query("ROLLBACK");
      return {
        success: false,
        error: "This single-use magic link has already been redeemed.",
      };
    }

    // Ensure session exists
    let sessionId = app.session_id;
    if (!sessionId) {
      sessionId = `sess-${crypto.randomUUID()}`;
      await client.query(
        `INSERT INTO sessions (id, candidate_id, current_stage, status, locked)
         VALUES ($1, $2, 'interview_instructions', 'active', true)
         ON CONFLICT (id) DO NOTHING;`,
        [sessionId, app.candidate_id]
      );
    }

    // Mark used and bind session
    await client.query(
      `UPDATE applications 
       SET magic_token_used_at = COALESCE(magic_token_used_at, now()),
           session_id = $1,
           status = CASE 
             WHEN status = 'shortlisted' THEN 'assessment_in_progress' 
             ELSE status 
           END,
           updated_at = now()
       WHERE id = $2;`,
      [sessionId, app.id]
    );

    await client.query("COMMIT");

    const jwtToken = signCandidateMagicJwt({
      candidateId: app.candidate_id,
      applicationId: app.id,
      organizationId: app.organization_id,
      sessionId,
      role: "candidate",
      email: app.email,
    });

    return {
      success: true,
      jwtToken,
      application: {
        id: app.id,
        jobId: app.job_id,
        jobTitle: app.job_title,
        candidateName: app.name,
        candidateEmail: app.email,
        organizationId: app.organization_id,
        sessionId,
        status: app.status,
      },
    };
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("[redeemMagicToken] Error during redemption:", err);
    return { success: false, error: err.message || "Failed to redeem token." };
  } finally {
    client.release();
  }
}
