const fs = require('fs');

const schema = `import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";

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

export const resumeAnalyses = pgTable('resume_analyses', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id),
  rawResumeText: text('raw_resume_text'),
  skills: jsonb('skills'),
  strengths: jsonb('strengths'),
  missingKeywords: jsonb('missing_keywords')
});

export const sessionViolations = pgTable('session_violations', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id),
  type: text('type'),
  severity: text('severity'),
  evidenceRef: text('evidence_ref')
});

export const roundOutputs = pgTable('round_outputs', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id)
});

export const assessments = pgTable('assessments', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id)
});

export const assessmentRecommendations = pgTable('assessment_recommendations', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id)
});

export const contacts = pgTable('contacts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
`;

fs.writeFileSync('/app/applet/src/db/schema.ts', schema);
