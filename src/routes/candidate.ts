/**
 * candidate.ts
 * 
 * Candidate onboarding and validation route helpers.
 * Adheres to Phase 1 Foundation requirements.
 */

import { Router, Request, Response } from "express";
import { validateCandidateEmail } from "../services/candidateService";

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

export default router;
