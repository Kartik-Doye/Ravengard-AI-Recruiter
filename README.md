# Ravengard AI Recruiter - Foundation Phase

This is the Foundation Phase of the Ravengard AI Recruiter platform. It enforces a strict, locked, one-way state machine for candidate onboarding.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Express.js
- **Database**: PostgreSQL via **Drizzle ORM**. *(Note: Drizzle ORM was chosen because the Prisma binary download failed in testing, and Drizzle provided a stable alternative for schema management.)*
- **Authentication**: JWT/Custom (or Firebase Auth if configured)
- **Resume Parsing**: `unpdf` (PDF) and `mammoth` (DOCX)

## Foundation Flow
1. **Registration**: Candidate signs up.
2. **Welcome**: Candidate sees the overview. **No session record exists yet.**
3. **Consent (The Lock)**: Candidate types "I Agree". The backend creates the `sessions` row, sets `locked: true`, and defaults `current_stage` to `resume_upload`. This is the one irreversible entry point.
4. **Resume Upload**: Candidate uploads their resume for AI intelligence extraction.

## Drizzle Schema Structure
The true architecture includes the multi-tenant organization structure to prevent future rebuilds:

```typescript
// /src/db/schema.ts
import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const stageEnum = pgEnum('session_stage', [
  'resume_upload',
  'resume_analysis',
  'interview_instructions',
  'device_check',
  'waiting_room',
  'interview_hr_friendly',
  'interview_technical',
  'interview_cto',
  'report_generation'
]);

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const organizationAdmins = pgTable('organization_admins', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id),
  email: text('email').notNull(),
  role: text('role').default('admin')
});

export const candidates = pgTable('candidates', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  emailVerified: boolean('email_verified').default(false),
  organizationId: text('organization_id').references(() => organizations.id)
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  candidateId: text('candidate_id').references(() => candidates.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  currentStage: stageEnum('current_stage').default('resume_upload'),
  status: text('status').default('active'),
  locked: boolean('locked').default(true),
  consentAcceptedAt: timestamp('consent_accepted_at'),
  policyVersion: text('policy_version'),
  thinkAgainUsesLeft: integer('think_again_uses_left')
});
```
