import { GoogleGenAI } from "@google/genai";
import { db } from "../db/index";
import {
  jobs,
  candidates,
  applications,
  aiScreeningResults,
  screeningQueue,
  sessions,
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { emailService } from "./emailService";
import {
  renderShortlistInvitationEmail,
  renderNonSelectionRejectionEmail,
} from "../templates/emailTemplates";
import { generateMagicToken } from "./magicTokenService";
import crypto from "crypto";

export interface ScreeningEvaluation {
  matchScore: number; // 0 to 100
  strengths: string[];
  keyGaps: string[];
  overallFitRationale: string;
  constructiveFeedbackForCandidate: string;
  recommendation: "RECOMMENDED" | "NOT_RECOMMENDED";
}

export class PreScreeningService {
  private static instance: PreScreeningService;
  private aiClient: GoogleGenAI | null = null;

  private constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  public static getInstance(): PreScreeningService {
    if (!PreScreeningService.instance) {
      PreScreeningService.instance = new PreScreeningService();
    }
    return PreScreeningService.instance;
  }

  /**
   * Evaluates candidate resume text against job description using Gemini AI.
   * Produces strictly structured rubric evaluations.
   */
  public async evaluateResume(
    jobTitle: string,
    jobDescription: string,
    requirementsJson: any,
    resumeText: string
  ): Promise<ScreeningEvaluation> {
    const fallbackEvaluation = this.generateDeterministicEvaluation(
      jobTitle,
      jobDescription,
      requirementsJson,
      resumeText
    );

    if (!process.env.GEMINI_API_KEY) {
      return fallbackEvaluation;
    }

    try {
      if (!this.aiClient) {
        this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      }

      const prompt = `
You are Ravengard's Principal Technical Recruiter and Assessment Engine.
Evaluate the candidate resume strictly against the Job Description and competencies.

ROLE TITLE:
${jobTitle}

JOB DESCRIPTION:
${jobDescription}

REQUIRED COMPETENCIES & RUBRIC:
${JSON.stringify(requirementsJson || {})}

CANDIDATE RESUME TEXT:
${resumeText.slice(0, 8000)}

INSTRUCTIONS:
1. Provide a rigorous, evidence-based JD Match Score from 0 to 100.
2. List 2-4 concrete strengths demonstrated in the resume matching the role.
3. List 1-3 specific gaps or missing competencies compared to the JD.
4. Provide an overall fit rationale for the hiring team.
5. Provide a constructive, polite, professional skill alignment feedback paragraph (2-3 sentences) suitable for candidate feedback.
6. Recommendation must be "RECOMMENDED" (if score >= 70) or "NOT_RECOMMENDED".

You MUST output ONLY a valid JSON object matching this schema:
{
  "matchScore": <number 0-100>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "keyGaps": ["<gap 1>", "<gap 2>"],
  "overallFitRationale": "<concise summary>",
  "constructiveFeedbackForCandidate": "<polite feedback>",
  "recommendation": "RECOMMENDED" | "NOT_RECOMMENDED"
}
`;

      const response = await this.aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text?.trim();
      if (!responseText) {
        return fallbackEvaluation;
      }

      const parsed = JSON.parse(responseText) as ScreeningEvaluation;

      // Validate bounds
      parsed.matchScore = Math.max(0, Math.min(100, Math.round(parsed.matchScore || 0)));
      if (!Array.isArray(parsed.strengths)) parsed.strengths = [];
      if (!Array.isArray(parsed.keyGaps)) parsed.keyGaps = [];

      return parsed;
    } catch (err: any) {
      console.warn("[PreScreeningService] LLM evaluation error, using resilient fallback:", err.message);
      return fallbackEvaluation;
    }
  }

  /**
   * Deterministic rule-based evaluation fallback when API quota is exhausted or offline.
   */
  private generateDeterministicEvaluation(
    jobTitle: string,
    jobDescription: string,
    requirementsJson: any,
    resumeText: string
  ): ScreeningEvaluation {
    const resumeLower = resumeText.toLowerCase();
    const skills: string[] = requirementsJson?.required_skills || [
      "typescript",
      "javascript",
      "react",
      "node",
      "sql",
      "postgresql",
      "system design",
    ];

    let matchedSkills: string[] = [];
    let missingSkills: string[] = [];

    for (const skill of skills) {
      if (resumeLower.includes(skill.toLowerCase())) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }

    const ratio = skills.length > 0 ? matchedSkills.length / skills.length : 0.75;
    const matchScore = Math.round(50 + ratio * 45); // Scale 50-95 based on keyword matching
    const isRecommended = matchScore >= 70;

    return {
      matchScore,
      strengths:
        matchedSkills.length > 0
          ? matchedSkills.map((s) => `Demonstrated hands-on experience in ${s}`)
          : ["General engineering experience aligned with technical requirements"],
      keyGaps:
        missingSkills.length > 0
          ? missingSkills.map((s) => `Limited verified production depth in ${s}`)
          : ["Could demonstrate deeper large-scale production architecture insights"],
      overallFitRationale: `Resume demonstrates ${matchScore}% alignment with core ${jobTitle} competencies. Candidate matched ${matchedSkills.length} of ${skills.length} target skills.`,
      constructiveFeedbackForCandidate:
        missingSkills.length > 0
          ? `While your background demonstrates valuable software engineering experience, our team prioritized depth in ${missingSkills.slice(0, 2).join(" and ")} for this specific role.`
          : `We appreciated your background, but we are moving forward with candidates whose experience more closely fits our immediate architectural focus.`,
      recommendation: isRecommended ? "RECOMMENDED" : "NOT_RECOMMENDED",
    };
  }

  /**
   * Process a queued candidate screening application asynchronously.
   */
  public async processScreeningJob(applicationId: string, appUrl: string): Promise<boolean> {
    const pool = (db as any).session?.client || (global as any)._postgresPool;
    if (!pool) return false;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Fetch application, job, candidate, and resume text
      const query = `
        SELECT 
          a.id, a.job_id, a.candidate_id, a.organization_id, a.status,
          j.title as job_title, j.description as job_desc, j.requirements_json,
          j.screening_threshold, j.require_human_rejection_approval,
          c.name as candidate_name, c.email as candidate_email,
          COALESCE(ra.raw_resume_text, '') as raw_resume_text
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN candidates c ON a.candidate_id = c.id
        LEFT JOIN sessions s ON a.session_id = s.id
        LEFT JOIN resume_analyses ra ON ra.session_id = s.id
        WHERE a.id = $1
        FOR UPDATE OF a;
      `;

      const { rows } = await client.query(query, [applicationId]);
      if (rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      const appData = rows[0];

      // Run evaluation
      const evalResult = await this.evaluateResume(
        appData.job_title,
        appData.job_desc,
        appData.requirements_json,
        appData.raw_resume_text || "Software Engineer with experience in web applications and backend systems."
      );

      // Persist AI screening result
      const screeningId = `scr-${crypto.randomUUID()}`;
      await client.query(
        `INSERT INTO ai_screening_results (
           id, application_id, match_score, strengths_summary, gaps_summary, full_rationale_json, screening_version
         )
         VALUES ($1, $2, $3, $4, $5, $6, 'v1.0')
         ON CONFLICT (application_id, screening_version) 
         DO UPDATE SET 
           match_score = EXCLUDED.match_score,
           strengths_summary = EXCLUDED.strengths_summary,
           gaps_summary = EXCLUDED.gaps_summary,
           full_rationale_json = EXCLUDED.full_rationale_json;`,
        [
          screeningId,
          applicationId,
          evalResult.matchScore,
          JSON.stringify(evalResult.strengths),
          JSON.stringify(evalResult.keyGaps),
          JSON.stringify({
            overallFitRationale: evalResult.overallFitRationale,
            constructiveFeedback: evalResult.constructiveFeedbackForCandidate,
            recommendation: evalResult.recommendation,
          }),
        ]
      );

      // Threshold decision
      const threshold = appData.screening_threshold || 70;
      const isShortlisted = evalResult.matchScore >= threshold;

      if (isShortlisted) {
        // Generate single-use magic token
        const magicToken = generateMagicToken(appUrl);

        await client.query(
          `UPDATE applications
           SET status = 'shortlisted',
               magic_token_hash = $1,
               magic_token_expires_at = $2,
               updated_at = now()
           WHERE id = $3;`,
          [magicToken.tokenHash, magicToken.expiresAt, applicationId]
        );

        // Queue Email #1 (Invitation)
        const emailContent = renderShortlistInvitationEmail({
          candidateName: appData.candidate_name || "Candidate",
          jobTitle: appData.job_title,
          companyName: "Ravengard Systems",
          magicAssessmentLink: magicToken.magicLinkUrl,
        });

        await emailService.queueEmail({
          recipientEmail: appData.candidate_email,
          recipientName: appData.candidate_name,
          templateType: "shortlist_invitation",
          subject: emailContent.subject,
          bodyText: emailContent.bodyText,
          bodyHtml: emailContent.bodyHtml,
          applicationId,
          organizationId: appData.organization_id,
        });
      } else {
        // Below threshold: Human-in-the-Loop decision
        if (appData.require_human_rejection_approval) {
          // Place into pending_rejection_review queue for HR batch approval
          await client.query(
            `UPDATE applications
             SET status = 'pending_rejection_review',
                 updated_at = now()
             WHERE id = $1;`,
            [applicationId]
          );
        } else {
          // Direct rejection
          await client.query(
            `UPDATE applications
             SET status = 'rejected_at_screening',
                 updated_at = now()
             WHERE id = $1;`,
            [applicationId]
          );

          // Queue Email #3 (Rejection)
          const rejectionContent = renderNonSelectionRejectionEmail({
            candidateName: appData.candidate_name || "Candidate",
            jobTitle: appData.job_title,
            constructiveFeedback: evalResult.constructiveFeedbackForCandidate,
          });

          await emailService.queueEmail({
            recipientEmail: appData.candidate_email,
            recipientName: appData.candidate_name,
            templateType: "non_selection_rejection",
            subject: rejectionContent.subject,
            bodyText: rejectionContent.bodyText,
            bodyHtml: rejectionContent.bodyHtml,
            applicationId,
            organizationId: appData.organization_id,
          });
        }
      }

      await client.query("COMMIT");
      return true;
    } catch (err: any) {
      await client.query("ROLLBACK");
      console.error(`[PreScreeningService] Failed to process app ${applicationId}:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Background queue poller for screening_queue with SKIP LOCKED.
   */
  public async processQueueBatch(appUrl: string, batchSize: number = 3): Promise<number> {
    const pool = (db as any).session?.client || (global as any)._postgresPool;
    if (!pool) return 0;

    let count = 0;

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const selectQuery = `
          SELECT * FROM screening_queue
          WHERE status = 'pending' AND attempts < 3
          ORDER BY created_at ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED;
        `;

        const { rows } = await client.query(selectQuery, [batchSize]);

        for (const row of rows) {
          // Mark processing
          await client.query(
            `UPDATE screening_queue SET status = 'processing', locked_at = now() WHERE id = $1;`,
            [row.id]
          );

          try {
            await this.processScreeningJob(row.application_id, appUrl);
            await client.query(
              `UPDATE screening_queue SET status = 'completed', updated_at = now() WHERE id = $1;`,
              [row.id]
            );
            count++;
          } catch (jobErr: any) {
            const nextAttempts = row.attempts + 1;
            const newStatus = nextAttempts >= 3 ? "screening_failed_manual_review" : "pending";
            await client.query(
              `UPDATE screening_queue 
               SET status = $1, attempts = $2, last_error = $3, updated_at = now() 
               WHERE id = $4;`,
              [newStatus, nextAttempts, jobErr.message, row.id]
            );
          }
        }

        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    } catch (e: any) {
      console.error("[PreScreeningService] Error in processQueueBatch:", e.message);
    }

    return count;
  }
}

export const preScreeningService = PreScreeningService.getInstance();
