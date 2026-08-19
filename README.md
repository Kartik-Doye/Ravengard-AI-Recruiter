# Ravengard AI Recruiter - Phase 1

This is Phase 1 of the Ravengard AI Recruiter AI interview preparation platform. It includes candidate registration, a consent flow, resume uploading with text extraction, and a minimal dashboard stub.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Express.js
- **Database**: PostgreSQL (Cloud SQL) via **Drizzle ORM**.
  *(Note: Drizzle ORM was used instead of Prisma ORM because Drizzle is explicitly mandated by the platform's Cloud SQL setup guidelines for schema management and interactions. Drizzle provides excellent type safety and performance.)*
- **Authentication**: Firebase Authentication (Google Sign-In)
- **Resume Parsing**: `pdf-parse` (PDF) and `mammoth` (DOCX)

## How to Run Locally

### Prerequisites
1. Node.js installed.
2. PostgreSQL database or Google Cloud SQL.
3. Firebase project configured.

### Environment Setup
Create a `.env` file in the root directory and ensure the following variables are set:
```
# Database connection settings
SQL_HOST=...
SQL_DB_NAME=...
SQL_USER=...
SQL_PASSWORD=...
SQL_ADMIN_USER=...
SQL_ADMIN_PASSWORD=...

# Firebase configuration
# (Alternatively, rely on the `firebase-applet-config.json` generated in the root)
```

### Running the App
1. Install dependencies:
   ```bash
   npm install
   ```
2. Push the schema to your database (requires admin DB credentials):
   ```bash
   npm run db:push
   ```
3. Start the development server (runs Express + Vite):
   ```bash
   npm run dev
   ```
4. Access the app at `http://localhost:3000`.

## Drizzle Schema Structure
Instead of a `schema.prisma` file, your schema is defined in TypeScript at `/src/db/schema.ts`. This makes it easy to extend for Phase 2.

```typescript
// /src/db/schema.ts
import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name').notNull(),
  mobile: text('mobile').notNull(),
  email: text('email').notNull(),
  college: text('college').notNull(),
  degree: text('degree').notNull(),
  gradYear: text('grad_year').notNull(),
  preferredLanguage: text('preferred_language').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  candidateId: integer('candidate_id').references(() => candidates.id).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('created'),
  currentStage: varchar('current_stage', { length: 50 }).notNull().default('welcome'),
  locked: boolean('locked').notNull().default(false),
  consentAcceptedAt: timestamp('consent_accepted_at'),
  resumeUrl: text('resume_url'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
});

export const resumeAnalyses = pgTable('resume_analyses', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id).notNull(),
  rawText: text('raw_text'),
});
```
