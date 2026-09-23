# Ravengard AI Recruiter - Foundation Phase

This is the Foundation Phase of the Ravengard AI Recruiter platform. It enforces a strict, locked, one-way state machine for candidate onboarding and enterprise talent evaluation.

## 🚀 Quick Start
To install and start the application right away, run:

```bash
# 1. Install dependencies
npm install

# 2. Run the application (Starts Express backend + React Vite on http://localhost:3000)
npm run dev
```

For complete setup instructions, database migrations, credentials, and architecture details, see **[RUN.md](./RUN.md)**.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Express.js
- **Database**: PostgreSQL via **Drizzle ORM**. *(Note: Drizzle ORM was chosen because the Prisma binary download failed in testing, and Drizzle provided a stable alternative for schema management.)*
- **Authentication**: JWT/Custom (or Firebase Auth if configured)
- **Resume Parsing**: `unpdf` (PDF) and `mammoth` (DOCX)

## Foundation Flow
1. **Registration**: Candidate signs up with:
   - Explicit **Country / Region of Residence** selector with ISO search/typeahead and flag icons.
   - Integrated **International Phone (STD) Dialing Code Selector** with dropdown prefix (`🇮🇳 +91`, `🇺🇸 +1`, `🇬🇧 +44`, etc.) storing numbers in full **E.164** format.
   - Dynamic phone number validation matching country-specific digit lengths and formatting hints.
   - Auto-detection of default country on mount via browser locale, timezone, and IP geolocation fallback.
   - Real-time **Account Security Password Strength Meter** with entropy scoring, sequence/dictionary pattern detection, and contextual checks against candidate credentials.
2. **Welcome**: Candidate sees the overview. **No session record exists yet.**
3. **Consent (The Lock)**: Candidate types "I Agree". The backend creates the `sessions` row, sets `locked: true`, initializes `assessment_expires_at` SLA timeout, and defaults `current_stage` to `resume_upload`. This is the one irreversible entry point.
4. **Resume Upload**: Candidate uploads their resume for AI intelligence extraction.

## Drizzle Schema Structure
The true architecture includes the multi-tenant organization structure and SLA tracking to prevent future rebuilds:

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
  mobile: text('mobile'), // Full international E.164 format (e.g. +917875693285)
  country: text('country').default('United States'), // Country of residence
  college: text('college'),
  degree: text('degree'),
  gradYear: text('grad_year'),
  preferredLanguage: text('preferred_language').default('English'),
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
  thinkAgainUsesLeft: integer('think_again_uses_left'),
  assessmentExpiresAt: timestamp('assessment_expires_at') // SLA deadline
});
```

## Project Documentation & Architecture
- **[Requirements Specification](REQUIREMENTS.md)**: System prerequisites, environment variables, database requirements, and client device specs.
- **[Operational Runbook & How to Run](HOW_TO_RUN.md)**: Step-by-step setup, database migrations, dev runner, credentials, and test instructions.
- **[End-to-End Hiring Process Capability Matrix](docs/HIRING_PROCESS_CAPABILITY.md)**: 10-stage evaluation matrix comparing traditional hiring vs. Ravengard capabilities, automation tiers, and legal compliance (GDPR Art 22 & NYC Law 144).

