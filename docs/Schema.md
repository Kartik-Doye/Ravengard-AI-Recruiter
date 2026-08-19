# Ravengard AI Recruiter - Database Schema & Architecture

## 1. Core Ownership Model
The data model treats the `session` as the anchor for all runtime data, enforcing strict phase progression and maintaining a clear boundary for privacy cascades.

- **users:** Identity anchor. (Deletions cascade down to all child data to comply with GDPR).
- **sessions:** Phase authority and runtime anchor. Tracks `current_phase`, `status`, `locked` state, and O(1) anti-cheat counters.
- **resume_parses:** Session-specific resume snapshot (ATS score, parsed skills).
- **session_violations:** Detailed event log for anti-cheat breaches.
- **round_outputs:** Validated, schema-checked round-level AI/candidate exchanges (transient stream chunks are NOT persisted).
- **assessments:** Final report and holistic scoring.
- **assessment_recommendations:** Normalized 4-week post-assessment guidance.

## 2. Implementation
- Drizzle ORM is used for schema definitions and migrations (`src/db/schema.ts`).
- All foreign keys linked to PII-bearing records use `ON DELETE CASCADE` to ensure clean erasure paths.
