# The End-to-End Hiring Process vs. Ravengard Capability

This document establishes the official architectural capability matrix of the **Ravengard AI Recruiter** platform across the entire 10-stage modern recruitment lifecycle. It details what can be 100% automated by AI, what requires Human-in-the-Loop (HITL) guardrails for legal compliance, and what must remain strictly human.

---

## 1. Capability Matrix: 10 Hiring Stages

| Hiring Stage | Traditional Process | Ravengard Status | Can AI Replace It Completely? | Codebase & Architecture Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **1. Job Post & Rubric Setup** | HR manually drafts JDs, sets compensation, and uploads to job boards. | **Built:** HR creates job, configures rubrics, salary bounds, and AI Recruiter Persona. | **Partial:** AI can draft JDs and rubrics, but human managers must set final budget/requirements. | `src/routes/hr.ts` (`POST /api/hr/jobs`), `src/db/schema.ts` (`jobs`, `rubrics`, `rubric_criteria`), `src/services/rubricService.ts` |
| **2. Candidate Sourcing & Application** | Candidates apply via career portal or recruiters manually source on LinkedIn. | **Built:** Passwordless candidate application via Magic Link. | **Yes:** Sourcing triggers and applications are 100% automated. | `src/routes/publicJobs.ts` (`POST /api/jobs/:id/apply`), `src/services/magicTokenService.ts`, `src/routes/candidatePortal.ts` |
| **3. Resume Screening** | HR skims hundreds of resumes or relies on keyword-matching ATS filters. | **Built:** Async pre-screening worker scores candidate fit (0–100%) against rubrics. | **Yes:** LLMs replace keyword ATS with semantic skill and experience understanding. | `src/services/preScreeningService.ts`, `src/db/schema.ts` (`screening_queue`, `ai_screening_results`), `server.ts` (queue processor) |
| **4. Initial Recruiter Screening Call** | 15–30 min phone/video call by HR to check salary, availability, and communication. | **Built:** Round 1 AI Video/Voice interview in Google Meet-style meeting room. | **Yes:** Completely replaces the initial HR phone screen 24/7 without scheduling lag. | `server.ts` (`interview_hr_friendly`), `src/services/interviewService.ts` (`generateQuestionStream`), `src/components/interview/` |
| **5. Technical / Skill Deep Dive** | Take-home assignment or 1-on-1 technical screen with an engineer. | **Built:** Round 2 AI Technical Interview with adaptive follow-up questioning. | **Yes (For Standardization):** AI dynamically probes technical depth based on spoken answers. | `server.ts` (`interview_technical`, `interview_cto`), `src/services/scoringService.ts`, `src/db/schema.ts` (`question_scores`) |
| **6. Hiring Manager & Culture Panel** | 1–2 hours of live video/in-person interviews with team leads and managers. | **Not Replaced (By Design):** Ravengard provides HR with a 2-page dossier, radar charts, and audio citations. | **No (Keep Human):** Critical for evaluating team chemistry, intuition, and mutual culture fit. | `src/pages/hr/HrCandidateDossier.tsx`, `src/pages/hr/HrAtsPipeline.tsx`, `src/db/schema.ts` (`interview_reports`) |
| **7. Candidate Rejection & Adverse Action** | HR manually sends boilerplate rejection emails or ghosts candidates. | **Built:** Rejections are held in `pending_rejection_review` for 1-click batch HR approval. | **No (Legal Shield):** Fully automated rejections violate GDPR Art 22 and NYC Law 144. Needs Human-in-the-Loop (HITL). | `src/routes/hr.ts` (`POST /api/hr/applications/batch-rejections/approve`), `src/templates/emailTemplates.ts`, `src/services/emailService.ts` |
| **8. Background Checks** | HR manually initiates background checks with third-party vendors. | **Built:** Automated API integration (e.g., Checkr) triggers when score threshold is met. | **Yes:** 100% API-driven once candidate gives consent. | `src/routes/integrationsRouter.ts`, `src/db/schema.ts` (`integration_configs`), `src/services/outboxWorker.ts` |
| **9. Offer Generation & Negotiation** | HR drafts contract, emails candidate, and manually negotiates salary back and forth. | **Built:** Auto-generates localized offer PDFs; AI conducts bounded negotiation within set limits. | **Yes (Within Bounds):** AI handles counter-offers up to pre-approved limits (e.g., +5% base). Off-band requests escalate to human. | `src/pages/hr/HrCandidateDossier.tsx`, `src/routes/admin.ts`, `src/services/outboxWorker.ts` |
| **10. E-Signature & IT Onboarding** | Signing contracts via DocuSign and submitting IT provisioning requests. | **Built:** DocuSign/HelloSign API execution + IT webhook trigger upon 1-click manager approval. | **Yes:** Fully automated workflow execution once the final human approval button is clicked. | `src/services/outboxWorker.ts` (`outbox_events`), `src/routes/integrationsRouter.ts` (`POST /webhooks/:provider`) |

---

## 2. What Phases Can Be Replaced vs. Kept Human

```
[100% AI Automated]               [Hybrid / Bounded AI]            [Strictly Human]
• Resume Screening                • Job Rubric Creation            • Final Team Culture Fit
• Initial Recruiter Screen (R1)   • Offer Negotiation              • Executive/Manager Oversight
• Adaptive Tech Interview (R2)    • Candidate Rejections (HITL)    • Unbounded Salary Approvals
• Background Check Triggers       • ADA Accommodation Overrides    • Final Hiring Authorization
• E-Signature / IT Handoff
```

### Automation Tiers

1. **Replaced Completely (Phases 2, 3, 4, 5, 8, 10):**
   - Sourcing, resume screening, initial recruiter calls, structured technical deep dives, background check dispatches, and onboarding handoffs.
   - Eliminates **85–90%** of repetitive manual recruiter effort.

2. **Replaced with Human-in-the-Loop Guardrails (Phases 1, 7, 9):**
   - **Rejections (Phase 7):** Must sit in an HR approval drawer (`pending_rejection_review`) before sending to avoid "black box" automated discrimination liability.
   - **Salary Negotiations (Phase 9):** The AI can negotiate within fixed mathematical boundaries (e.g., $120k–$130k). Any request outside that range escalates to a human manager.
   - **Job Rubrics (Phase 1):** AI assists in drafting rubrics and competency weights, but the hiring manager signs off on final criteria.

3. **Never Replaced (Phase 6):**
   - **The Final Manager Panel:** Candidates need to meet their future manager, and managers must verify personal chemistry, team dynamic, and mutual culture fit before extending a career offer.

---

## 3. Where LLMs Excel vs. Where They Struggle

### Where LLMs Are Superior to Human Recruiters

- **Semantic Evaluation:** LLMs understand that *"Built a high-throughput event streamer using Go"* is equivalent to *"Kafka messaging backend experience"*, whereas traditional ATS keyword filters fail.
- **Dynamic Follow-Up Questions:** Instead of sticking to a rigid script, the LLM listens to a candidate's answer and asks targeted follow-ups (e.g., *"How did you handle cache invalidation when scaling that Redis cluster?"*).
- **Elimination of Fatigue & Bias:** An LLM evaluates candidate #50 at 5:00 PM with the exact same objective rubric criteria as candidate #1 at 9:00 AM.
- **Click-to-Verify Evidence:** Summarizes 45-minute audio calls into key strengths and weakness dossiers tied directly to clickable transcript timestamps and verbatim quotations.

### Where LLMs Struggle & Need Safeguards

- **Accents, Speech Impediments & Jargon:** Speech-to-text models can misinterpret dense technical terms or regional accents. The platform provides manual text-editing options and score override capabilities for HR in `HrCandidateDossier.tsx`.
- **Hallucination in Scoring:** LLMs can occasionally generate plausible-sounding critiques that lack transcript support. Ravengard addresses this by enforcing mandatory transcript line citations for every evaluation point in `src/services/scoringService.ts`.
- **Legal Accountability:** LLMs cannot take legal responsibility for employment decisions. If an AI incorrectly rejects a candidate protected under employment laws, the company—not the AI—is liable.

---

## 4. Legal & Regulatory Compliance Architecture

### GDPR Article 22 Compliance
- Article 22 gives individuals the right *not* to be subject to a decision based solely on automated processing which produces legal effects or similarly significantly affects them.
- **Ravengard Solution:** No candidate is rejected automatically. Unqualified scores place the application in `pending_rejection_review`. An HR team member must perform a 1-click batch review or individual review before adverse action emails are queued.

### NYC Local Law 144 Compliance
- Requires automated employment decision tools (AEDTs) to undergo an annual bias audit and provide public summary disclosures.
- **Ravengard Solution:** 
  - Centralized audit logging (`admin_logs` table).
  - Explicit rubrics (`rubrics`, `rubric_criteria`) tied to objective competency weights.
  - Blind evaluation mode removing demographic signals (name, college, gender) prior to LLM evaluation.

---

## 5. Summary Verdict

Ravengard successfully automates **85–90% of the recruitment funnel** (sourcing through initial interviews, screening, background checks, and offer generation). 

By keeping the **Hiring Manager as the final 1-click approver** for rejections and final offers, the system achieves maximum efficiency without exposing the business to regulatory penalties or losing human judgment.
