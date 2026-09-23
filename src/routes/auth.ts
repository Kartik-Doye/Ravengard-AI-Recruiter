import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db/index";
import { signCandidateProfileJwt } from "../services/magicTokenService";

export const authRouter = Router();

/**
 * POST /api/auth/candidate-mock-login
 * Quick authentication / mock login for candidates during onboarding and assessment tests.
 */
authRouter.post("/candidate-mock-login", async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body || {};
    const candidateEmail = (email || `test-${crypto.randomUUID().slice(0, 8)}@example.com`).toLowerCase().trim();
    const candidateName = name || "Test Candidate";
    const candidateId = `cand-${crypto.createHash("md5").update(candidateEmail).digest("hex").slice(0, 16)}`;

    // Upsert candidate record in candidates table
    const pool = (db as any).session?.client || (global as any)._postgresPool;
    if (pool) {
      await pool.query(
        `INSERT INTO candidates (id, email, name, organization_id)
         VALUES ($1, $2, $3, 'org-ravengard-default')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`,
        [candidateId, candidateEmail, candidateName]
      );
    }

    const token = signCandidateProfileJwt({
      id: candidateId,
      email: candidateEmail,
      name: candidateName,
    });

    return res.status(200).json({
      success: true,
      token,
      candidate: {
        id: candidateId,
        email: candidateEmail,
        name: candidateName,
      },
    });
  } catch (err: any) {
    console.error("[Auth Router] Candidate mock login error:", err);
    return res.status(500).json({ success: false, error: "Mock login failed" });
  }
});

export default authRouter;
