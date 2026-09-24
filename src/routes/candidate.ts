/**
 * candidate.ts
 * 
 * Candidate onboarding, validation, and session heartbeat route helpers.
 * Adheres to Phase 1 Foundation and Resilience requirements.
 */

import { Router, Request, Response } from "express";
import { validateCandidateEmail } from "../services/candidateService";
import { createPool } from "../db/index";

const router = Router();

/**
 * Validates an email candidate input prior to registration form submission.
 */
router.post("/validate-email", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ valid: false, error: "Email is required" });
    }

    const result = await validateCandidateEmail(email);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message || "Failed to validate email" });
  }
});

/**
 * POST /api/candidate/heartbeat
 * 15-second heartbeat ping from active candidate portal sessions.
 */
router.post("/heartbeat", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ success: false, error: "sessionId is required" });
    }

    const pool = createPool();
    if (pool) {
      try {
        await pool.query(
          `UPDATE sessions 
           SET last_active_at = NOW() 
           WHERE id = $1`,
          [sessionId]
        );
      } catch (dbErr) {
        // Silently tolerate if schema is adapting
      }
    }

    return res.json({
      status: "acknowledged",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
