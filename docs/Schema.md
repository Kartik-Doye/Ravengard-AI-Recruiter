# Ravengard AI Recruiter - Database Schema & Architecture

## 1. Core Ownership Model
The data model treats the `session` as the anchor for all runtime data, enforcing strict phase progression and maintaining a clear boundary for privacy cascades.

- **organizations:** Multi-tenant enterprise tenant anchor.
- **organization_admins:** Role-based access control for administrative evaluation (Admin, Reviewer, Viewer).
- **candidates:** Identity anchor with international registration support.
  - `id` (text, primary key)
  - `email` (text, not null)
  - `name` (text)
  - `mobile` (text, full international E.164 format, e.g. `+917875693285` or `+15550192834`)
  - `country` (text, default 'United States')
  - `college` (text)
  - `degree` (text)
  - `grad_year` (text)
  - `preferred_language` (text, default 'English')
  - `email_verified` (boolean, default false)
  - `organization_id` (foreign key -> organizations.id)
- **sessions:** Phase authority and runtime anchor.
  - `id` (text, primary key)
  - `candidate_id` (foreign key -> candidates.id)
  - `current_stage` (session_stage enum)
  - `status` (text, default 'active')
  - `locked` (boolean, default true)
  - `consent_accepted_at` (timestamp)
  - `policy_version` (text)
  - `think_again_uses_left` (integer, default 2)
  - `assessment_expires_at` (timestamp, SLA deadline window)
  - `version` (integer, optimistic locking counter)
- **resume_parses / resume_intelligence:** Session-specific resume snapshot (ATS score, parsed skills, work experience).
- **integrity_signals:** Real-time telemetry log for anti-cheat and session monitoring (`tab_blur`, `gaze_off`, `window_switch`).
- **interview_questions & interview_responses:** Schema-checked round-level AI/candidate exchanges.
- **scorecards & final_reports:** Final holistic scoring, competency breakdowns, rubric versioning, and hiring recommendation.

## 2. Implementation & Governance
- Drizzle ORM is used for schema definitions and migrations (`src/db/schema.ts`).
- All foreign keys linked to PII-bearing records use `ON DELETE CASCADE` to ensure clean erasure paths under GDPR Art. 17.
- Phone numbers are stored strictly in international E.164 format to guarantee worldwide calling compatibility.
- SLA expiration is validated server-side on all stage transition attempts to prevent stale session exploits.
